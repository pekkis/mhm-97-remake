import { setup, assign, fromPromise, sendTo } from "xstate";
import { produce } from "immer";

import {
  createDefaultGameContext,
  type GameContext,
  type Manager
} from "@/state";
import { loadGame } from "@/services/persistence";
import {
  teamsMainCompetition,
  managersMainCompetition
} from "@/machines/selectors";
import difficultyLevels from "@/data/difficulty-levels";
import teamData from "@/data/teams";
import calendar from "@/data/calendar";
import strategies from "@/data/strategies";
import random from "@/services/random";
import { notificationsMachine } from "@/machines/notifications";
import { values } from "remeda";

/**
 * Application lifecycle machine.
 *
 * Models the top-level menu ↔ game lifecycle:
 *   menu → starting (new game form) → "in_game"
 *   menu → loading (load from localStorage) → "in_game"
 *   "in_game" → menu (quit)
 *
 * The machine owns the full `GameContext`. While in `menu`, the context
 * holds default values (teams, competitions, country strengths) but no
 * active manager and no in-progress game data. Entering `"in_game"` happens
 * via `START_GAME → GAME_STARTED` (new game) or `LOAD_GAME → GAME_LOADED`
 * (with snapshot payload). `QUIT` resets the context back to defaults.
 *
 * Game-loop state (round/phase progression) will live as nested states
 * under `"in_game"` — this machine is the single root, not a parent of a
 * separate `gameMachine`.
 */

export type ManagerSubmission = {
  name: string;
  arena: string;
  difficulty: string;
  team: number;
};

export type AppMachineEvents =
  | { type: "START_GAME" }
  | { type: "LOAD_GAME" }
  | { type: "QUIT" }
  | { type: "ADVANCE" }
  | {
      type: "ADD_MANAGER";
      payload: ManagerSubmission;
    }
  | {
      type: "SELECT_STRATEGY";
      payload: { manager: string; strategy: number };
    }
  | {
      type: "PLACE_CHAMPION_BET";
      payload: {
        manager: string;
        team: number;
        amount: number;
        odds: number;
      };
    }
  | { type: "DISMISS_NOTIFICATION"; id: string };

const buildManager = (sub: ManagerSubmission, ctx: GameContext) => {
  const difficulty = parseInt(sub.difficulty, 10);
  const main = teamsMainCompetition(sub.team)(ctx);
  const manager: Manager = {
    id: crypto.randomUUID(),
    name: sub.name,
    team: sub.team,
    difficulty,
    pranksExecuted: 0,
    services: {
      coach: false,
      insurance: false,
      microphone: false,
      cheer: false
    },
    balance: difficultyLevels[difficulty].startBalance,
    arena: { name: sub.arena, level: main === "phl" ? 3 : 0 },
    extra: 0,
    insuranceExtra: 0,
    flags: {}
  };

  return { manager, teamId: sub.team };
};

export const appMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as AppMachineEvents
  },

  actors: {
    load_from_storage: fromPromise<GameContext>(async () => {
      const loaded = loadGame();
      if (!loaded) {
        throw new Error("no saved game");
      }
      return loaded;
    }),
    notifications: notificationsMachine
  },

  actions: {
    resetContext: assign(() => createDefaultGameContext()),

    advanceRound: assign(({ context }) =>
      produce(context, (draft) => {
        for (const team of draft.teams) {
          team.effects = team.effects.filter((e) => e.duration > 0);
          team.opponentEffects = team.opponentEffects.filter(
            (e) => e.duration > 0
          );
        }
        draft.turn.round += 1;
      })
    ),

    /**fully replaces the legacy `seasonStart()`
     * saga + the per-competition `start()` sagas + the `seasonStart` reducer.
     *
     * Per-team and per-manager bookkeeping plus competition reset. The
     * competition-specific bits (PHL/division do nothing; tournaments clear
     * teams; EHL picks medalists+foreign and shuffles) are inlined here —
     * this is MHM 97 game logic, not something competitions should own.
     */
    seasonStartSetup: assign(({ context }) =>
      produce(context, (draft) => {
        const season = draft.turn.season;

        // Re-strength European teams (indices 24+).
        for (let i = 24; i < draft.teams.length; i++) {
          draft.teams[i].strength = teamData[draft.teams[i].id].strength();
        }

        // Reset per-team season state.
        for (const t of draft.teams) {
          t.effects = [];
          t.opponentEffects = [];
          t.morale = 0;
          t.strategy = 2;
          t.readiness = 0;
        }

        draft.flags.jarko = false;

        // Reset every competition.
        for (const comp of values(draft.competitions)) {
          comp.phase = -1;
          comp.phases = [];
        }

        // Tournaments: start with no teams; the seed phase fills them in.
        draft.competitions.tournaments.teams = [];

        // EHL: previous season's medalists (or the seeded default first season)
        // plus 17 foreign teams, shuffled.
        const ehlSeeds = context.stats.seasons[season - 1]?.medalists ?? [
          2, 3, 5
        ];
        const foreignIds = draft.teams.slice(24, 24 + 17).map((t) => t.id);
        draft.competitions.ehl.teams = [...ehlSeeds, ...foreignIds].toSorted(
          () => random.real(1, 10000) - 5000
        );

        // Per-manager: salary, insurance extra (skipped season 0), reset extra.        }

        for (const manager of values(draft.manager.managers)) {
          if (season > 0) {
            const team = draft.teams[manager.team!];
            const mainCompetition = managersMainCompetition(manager.id)(
              context
            );
            const salaryPerStrength =
              difficultyLevels[manager.difficulty].salary(mainCompetition);
            manager.balance -= salaryPerStrength * team.strength;

            if (manager.services.insurance) {
              manager.insuranceExtra -= 50 * manager.arena.level;
            }
          }

          manager.extra = difficultyLevels[manager.difficulty].extra;
        }
      })
    ),

    assignManager: assign(
      ({ context }, params: { manager: ManagerSubmission }) => {
        const { manager, teamId } = buildManager(params.manager, context);
        return {
          manager: {
            active: manager.id,
            managers: { ...context.manager.managers, [manager.id]: manager }
          },
          teams: context.teams.map((t) =>
            t.id === teamId ? { ...t, manager: manager.id } : t
          )
        };
      }
    ),

    /**
     * select_strategy — sets the chosen strategy and rolls initial readiness
     * for the manager's team. 1-1 port of the legacy `selectStrategy()` saga.
     */
    selectStrategy: assign(
      ({ context }, params: { manager: string; strategy: number }) =>
        produce(context, (draft) => {
          const team = draft.manager.managers[params.manager]?.team;
          if (team === undefined) {
            return;
          }
          draft.teams[team].strategy = params.strategy;
          draft.teams[team].readiness =
            strategies[params.strategy].initialReadiness();
        })
    ),

    /**
     * championship_betting — record the bet and pay the stake. 1-1 port of
     * the legacy `betChampion()` saga (data half).
     */
    placeChampionBet: assign(
      (
        { context },
        params: { manager: string; team: number; amount: number; odds: number }
      ) =>
        produce(context, (draft) => {
          draft.betting.championshipBets.push({
            manager: params.manager,
            team: params.team,
            amount: params.amount,
            odds: params.odds
          });
          const m = draft.manager.managers[params.manager];
          if (m) {
            m.balance -= params.amount;
          }
        })
    ),

    /**
     * Side-effect half of `betChampion()` — the toast.
     */
    notifyBetPlaced: sendTo(
      "notifications",
      (_, params: { manager: string }) => ({
        type: "PUSH",
        notification: {
          id: crypto.randomUUID(),
          manager: params.manager,
          message:
            "Kiikutat mestarusveikkauskuponkisi S-kioskille. Olkoon onni myötä!",
          type: "info"
        }
      })
    )
  },

  guards: {
    has_phase: ({ context }, params: { phase: string }) =>
      calendar[context.turn.round]?.phases.includes(params.phase) ?? false,
    calendar_in_bounds: ({ context }) => context.turn.round < calendar.length
  }
}).createMachine({
  id: "app",
  initial: "main_menu",
  context: () => createDefaultGameContext(),
  invoke: {
    src: "notifications",
    id: "notifications",
    systemId: "notifications"
  },
  on: {
    DISMISS_NOTIFICATION: {
      actions: sendTo("notifications", ({ event }) => ({
        type: "DISMISS",
        id: event.id
      }))
    }
  },
  states: {
    main_menu: {
      on: {
        START_GAME: { target: "starting" },
        LOAD_GAME: { target: "loading" }
      }
    },
    starting: {
      on: {
        ADD_MANAGER: {
          actions: [
            {
              type: "assignManager",
              params: ({ event }) => {
                return { manager: event.payload };
              }
            }
          ],

          target: "in_game"
        },
        QUIT: { target: "main_menu", actions: "resetContext" }
      }
    },
    loading: {
      invoke: {
        src: "load_from_storage",
        onDone: {
          target: "in_game",
          actions: assign(({ event }) => event.output)
        },
        onError: {
          target: "main_menu"
        }
      }
    },
    in_game: {
      initial: "executing_phases",
      on: {
        QUIT: { target: "main_menu", actions: "resetContext" }
      },
      states: {
        executing_phases: {
          initial: "action_check",
          states: {
            action_check: {
              always: [
                {
                  guard: { type: "has_phase", params: { phase: "action" } },
                  target: "action"
                },
                { target: "prank_check" }
              ]
            },
            action: {
              on: { ADVANCE: "prank_check" }
            },

            prank_check: {
              always: [
                {
                  guard: { type: "has_phase", params: { phase: "prank" } },
                  target: "prank"
                },
                { target: "gameday_check" }
              ]
            },
            prank: {
              on: { ADVANCE: "gameday_check" }
            },

            gameday_check: {
              always: [
                {
                  guard: { type: "has_phase", params: { phase: "gameday" } },
                  target: "gameday"
                },
                { target: "calculations_check" }
              ]
            },
            gameday: {
              on: { ADVANCE: "calculations_check" }
            },

            calculations_check: {
              always: [
                {
                  guard: {
                    type: "has_phase",
                    params: { phase: "calculations" }
                  },
                  target: "calculations"
                },
                { target: "event_creation_check" }
              ]
            },
            calculations: {
              on: { ADVANCE: "event_creation_check" }
            },

            event_creation_check: {
              always: [
                {
                  guard: {
                    type: "has_phase",
                    params: { phase: "event_creation" }
                  },
                  target: "event_creation"
                },
                { target: "event_check" }
              ]
            },
            event_creation: {
              on: { ADVANCE: "event_check" }
            },

            event_check: {
              always: [
                {
                  guard: { type: "has_phase", params: { phase: "event" } },
                  target: "event"
                },
                { target: "news_check" }
              ]
            },
            event: {
              on: { ADVANCE: "news_check" }
            },

            news_check: {
              always: [
                {
                  guard: { type: "has_phase", params: { phase: "news" } },
                  target: "news"
                },
                { target: "invitations_create_check" }
              ]
            },
            news: {
              on: { ADVANCE: "invitations_create_check" }
            },

            invitations_create_check: {
              always: [
                {
                  guard: {
                    type: "has_phase",
                    params: { phase: "invitations_create" }
                  },
                  target: "invitations_create"
                },
                { target: "invitations_process_check" }
              ]
            },
            invitations_create: {
              on: { ADVANCE: "invitations_process_check" }
            },

            invitations_process_check: {
              always: [
                {
                  guard: {
                    type: "has_phase",
                    params: { phase: "invitations_process" }
                  },
                  target: "invitations_process"
                },
                { target: "start_of_season_check" }
              ]
            },
            invitations_process: {
              on: { ADVANCE: "start_of_season_check" }
            },

            start_of_season_check: {
              always: [
                {
                  guard: {
                    type: "has_phase",
                    params: { phase: "start_of_season" }
                  },
                  target: "start_of_season"
                },
                { target: "seed_check" }
              ]
            },
            start_of_season: {
              initial: "setup",
              onDone: "seed_check",
              states: {
                setup: {
                  entry: "seasonStartSetup",
                  always: "select_strategy"
                },
                select_strategy: {
                  on: {
                    SELECT_STRATEGY: {
                      actions: [
                        {
                          type: "selectStrategy",
                          params: ({ event }) => event.payload
                        }
                      ],
                      target: "championship_betting"
                    }
                  }
                },
                championship_betting: {
                  on: {
                    PLACE_CHAMPION_BET: {
                      actions: [
                        {
                          type: "placeChampionBet",
                          params: ({ event }) => event.payload
                        },
                        {
                          type: "notifyBetPlaced",
                          params: ({ event }) => ({
                            manager: event.payload.manager
                          })
                        }
                      ],
                      target: "done"
                    },
                    ADVANCE: "done"
                  }
                },
                done: { type: "final" }
              }
            },

            seed_check: {
              always: [
                {
                  guard: { type: "has_phase", params: { phase: "seed" } },
                  target: "seed"
                },
                { target: "gala_check" }
              ]
            },
            seed: {
              on: { ADVANCE: "gala_check" }
            },

            gala_check: {
              always: [
                {
                  guard: { type: "has_phase", params: { phase: "gala" } },
                  target: "gala"
                },
                { target: "end_of_season_check" }
              ]
            },
            gala: {
              on: { ADVANCE: "end_of_season_check" }
            },

            end_of_season_check: {
              always: [
                {
                  guard: {
                    type: "has_phase",
                    params: { phase: "end_of_season" }
                  },
                  target: "end_of_season"
                },
                { target: "round_end" }
              ]
            },
            end_of_season: {
              on: { ADVANCE: "round_end" }
            },

            round_end: {
              entry: "advanceRound",
              always: [
                { guard: "calendar_in_bounds", target: "action_check" },
                { target: "season_done" }
              ]
            },

            // Parking state for "ran off the calendar". Real season-boundary
            // logic (reset round, bump season) lands when end_of_season is
            // migrated.
            season_done: {}
          }
        }
      }
    }
  }
});
