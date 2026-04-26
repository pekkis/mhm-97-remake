import { setup, assign, sendTo, enqueueActions } from "xstate";
import { produce } from "immer";

import type { GameContext } from "@/state";
import {
  managersMainCompetition,
  managerCompetesIn,
  canImproveArena,
  canOrderPrank,
  canBuyPlayer,
  canSellPlayer
} from "@/machines/selectors";
import difficultyLevels from "@/data/difficulty-levels";
import teamData from "@/data/teams";
import calendar from "@/data/calendar";
import competitionData from "@/data/competitions";
import { computeStats } from "@/services/competition-type";
import strategies from "@/data/strategies";
import prankTypes from "@/game/pranks";
import arenas from "@/data/arenas";
import playerTypes from "@/data/transfer-market";
import random from "@/services/random";
import { notificationsMachine } from "@/machines/notifications";
import type { NotificationData } from "@/machines/notification";
import type { CompetitionId } from "@/types/competitions";
import { values } from "remeda";

/**
 * Game machine.
 *
 * Spawned by `appMachine` once the player has either finished the new-game
 * wizard or loaded a save. Receives a fully-formed `GameContext` as input;
 * owns the round/phase progression from there.
 *
 * The menu ↔ starting ↔ loading lifecycle lives in `appMachine`. Quitting
 * is handled at the app level (it stops this actor); this machine has no
 * concept of a "menu" to return to.
 */

export type ManagerSubmission = {
  name: string;
  arena: string;
  difficulty: string;
  team: number;
};

export type GameMachineEvents =
  | { type: "ADVANCE" }
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
  | {
      type: "ORDER_PRANK";
      payload: { manager: string; type: string; victim: number };
    }
  | {
      type: "IMPROVE_ARENA";
      payload: { manager: string };
    }
  | {
      type: "BUY_PLAYER";
      payload: { manager: string; playerType: number };
    }
  | {
      type: "SELL_PLAYER";
      payload: { manager: string; playerType: number };
    }
  | {
      type: "TEAM_INCUR_PENALTY";
      payload: {
        competition: CompetitionId;
        phase: number;
        group: number;
        team: number;
        penalty: number;
      };
    }
  | { type: "SAVED" }
  | { type: "DISMISS_NOTIFICATION"; id: string };

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    input: {} as GameContext,
    events: {} as GameMachineEvents
  },

  actors: {
    notifications: notificationsMachine
  },

  actions: {
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
     * seed phase — for every `{ competition, phase }` entry in the current
     * round's calendar, run that competition's pure `seed[phase]` builder
     * and append the resulting `Phase` onto `competitions[id].phases`.
     *
     * 1-1 port of `sagas/phase/seed.ts` + `seedCompetition()` in
     * `sagas/game.ts`. The legacy saga had a callback indirection (the
     * tournaments saga returned a `setCompetitionTeams` saga to be invoked
     * after the seeder ran); here we do that mirroring unconditionally —
     * `comp.teams = phase.teams` is a no-op for competitions whose phase
     * teams already match `comp.teams` (PHL/division/EHL), and matches the
     * tournaments behavior. If a future competition needs different
     * mirroring, revisit.
     */
    executeSeedPhase: assign(({ context }) =>
      produce(context, (draft) => {
        const seeds = calendar[draft.turn.round]?.seed ?? [];
        for (const { competition, phase } of seeds) {
          const def = competitionData[competition];
          const ctxFn = def.seedContext?.[phase];
          const seederContext = ctxFn ? ctxFn(context) : undefined;
          const newPhase = def.seed[phase](draft.competitions, seederContext);
          draft.competitions[competition].phases.push(newPhase);
          draft.competitions[competition].phase = phase;
          draft.competitions[competition].teams = newPhase.teams;
          // Materialize initial stats for every group so the league tables
          // have something to render before the first gameday. 1-1 port of
          // the legacy `calculatePhaseStats` saga that ran on COMPETITION_SEED.
          for (const g of newPhase.groups) {
            g.stats = computeStats(g);
          }
        }
      })
    ),

    /**
     * order a prank — debits the manager, queues the prank, and bumps the
     * per-season counter. 1-1 port of the legacy `orderPrank()` saga +
     * `addCase(orderPrank)` in the manager duck. The actual gameday-side
     * effect (`pranks[type].execute`) still runs from the saga side.
     *
     * Notification is delivered separately via the `notify` action; UI
     * gating (`pranksPerSeason` cap, calendar `pranks` flag) stays in the
     * Pranks page.
     */
    executeOrderPrank: assign(
      (
        { context },
        params: { manager: string; type: string; victim: number }
      ) =>
        produce(context, (draft) => {
          const competesInPHL = managerCompetesIn(
            params.manager,
            "phl"
          )(context);
          const targetCompetition = competesInPHL ? "phl" : "division";
          const price = prankTypes[params.type].price(targetCompetition);

          const m = draft.manager.managers[params.manager];
          if (!m) {
            return;
          }
          m.balance -= price;
          m.pranksExecuted += 1;
          draft.prank.pranks.push({
            manager: params.manager,
            type: params.type,
            victim: params.victim
          });
        })
    ),

    /**
     * improve arena — debits the manager and bumps their arena level by
     * one (clamped 0..9). 1-1 port of the legacy `improveArena()` saga.
     * Notification delivered separately via the `notify` action; UI gating
     * (price affordable, level < 9) stays in `Arena.tsx`.
     */
    executeImproveArena: assign(({ context }, params: { manager: string }) =>
      produce(context, (draft) => {
        const m = draft.manager.managers[params.manager];
        if (!m) {
          return;
        }
        const nextLevel = m.arena.level + 1;
        const nextArena = arenas[nextLevel];
        if (!nextArena) {
          return;
        }
        m.balance -= nextArena.price;
        m.arena.level = Math.max(0, Math.min(9, nextLevel));
      })
    ),

    /**
     * Buy a player from the transfer market: debit the manager and bump
     * their team's strength by a randomized skill amount. 1-1 port of the
     * legacy `buyPlayer()` saga.
     *
     * Lives outside the on-handler's `actions` array because the random
     * roll has to happen once — the assign and the notify both reference
     * the same `skillGain`. `enqueueActions` lets us do both with built-in
     * primitives (no dev-mode warning).
     */
    executeBuyPlayer: enqueueActions(
      (
        { context, enqueue },
        params: { manager: string; playerType: number }
      ) => {
        const playerType = playerTypes[params.playerType];
        const skillGain = playerType.skill();
        enqueue.assign(
          produce(context, (draft) => {
            const m = draft.manager.managers[params.manager];
            if (!m || m.team === undefined) {
              return;
            }
            m.balance -= playerType.buy;
            draft.teams[m.team].strength += skillGain;
          })
        );
        enqueue.sendTo("notifications", {
          type: "PUSH" as const,
          notification: {
            id: crypto.randomUUID(),
            manager: params.manager,
            message: `Ostamasi pelaaja tuo ${skillGain} lisää voimaa joukkueeseen!`,
            type: "info" as const
          }
        });
      }
    ),

    /**
     * Sell a player to the transfer market: credit the manager and drop
     * their team's strength by a randomized skill amount. 1-1 port of the
     * legacy `sellPlayer()` saga. The strength-floor check lives in the
     * `canSellPlayer` guard upstream; the failure-path notification is
     * emitted from the on-handler's else branch.
     */
    executeSellPlayer: enqueueActions(
      (
        { context, enqueue },
        params: { manager: string; playerType: number }
      ) => {
        const playerType = playerTypes[params.playerType];
        const skillLoss = playerType.skill();
        enqueue.assign(
          produce(context, (draft) => {
            const m = draft.manager.managers[params.manager];
            if (!m || m.team === undefined) {
              return;
            }
            m.balance += playerType.sell;
            draft.teams[m.team].strength -= skillLoss;
          })
        );
        enqueue.sendTo("notifications", {
          type: "PUSH" as const,
          notification: {
            id: crypto.randomUUID(),
            manager: params.manager,
            message: `Myymäsi pelaaja vie ${skillLoss} voimaa mukanaan!`,
            type: "info" as const
          }
        });
      }
    ),

    /**
     * Apply a points penalty to a team in a round-robin group, then
     * recompute that group's stats so the standings reflect it
     * immediately. 1-1 port of the legacy `incurPenalty()` saga (which
     * dispatched `teamIncurPenalty` followed by `calculateGroupStats`).
     *
     * Penalties only exist on round-robin groups; other group types
     * silently no-op.
     */
    executeIncurPenalty: assign(
      (
        { context },
        params: {
          competition: CompetitionId;
          phase: number;
          group: number;
          team: number;
          penalty: number;
        }
      ) =>
        produce(context, (draft) => {
          const g =
            draft.competitions[params.competition].phases[params.phase].groups[
              params.group
            ];
          if (g.type !== "round-robin") {
            return;
          }
          g.penalties.push({ team: params.team, penalty: params.penalty });
          g.stats = computeStats(g);
        })
    ),

    /**
     * Generic notification dispatcher — forwards a fully-formed notification
     * to the invoked `notifications` child machine. Call sites build the
     * message; this action only handles the delivery + id assignment.
     */
    notify: sendTo(
      "notifications",
      (
        _,
        params: {
          notification: Omit<NotificationData, "id"> & { timeout?: number };
        }
      ) => ({
        type: "PUSH" as const,
        notification: { id: crypto.randomUUID(), ...params.notification }
      })
    )
  },

  guards: {
    has_phase: ({ context }, params: { phase: string }) =>
      calendar[context.turn.round]?.phases.includes(params.phase) ?? false,
    calendar_in_bounds: ({ context }) => context.turn.round < calendar.length
  }
}).createMachine({
  id: "game",
  initial: "in_game",
  context: ({ input }) => input,
  invoke: [
    {
      src: "notifications",
      id: "notifications",
      systemId: "notifications",
      input: { defaultTimeout: 7000 }
    }
  ],
  on: {
    DISMISS_NOTIFICATION: {
      actions: sendTo("notifications", ({ event }) => ({
        type: "DISMISS",
        id: event.id
      }))
    },
    ORDER_PRANK: {
      // Mirror of the `Pranks.tsx` Calendar gate + per-type affordability
      // check in `SelectType`. Price is resolved here (selectors can't
      // import `@/game/pranks` without dragging the whole saga graph in).
      guard: ({ context, event }) => {
        const competesInPHL = managerCompetesIn(
          event.payload.manager,
          "phl"
        )(context);
        const competition = competesInPHL ? "phl" : "division";
        const prank = prankTypes[event.payload.type];
        if (!prank) {
          return false;
        }
        return canOrderPrank(
          event.payload.manager,
          prank.price(competition)
        )(context);
      },
      actions: [
        {
          type: "executeOrderPrank",
          params: ({ event }) => event.payload
        },
        {
          type: "notify",
          params: ({ event }) => ({
            notification: {
              manager: event.payload.manager,
              message: prankTypes[event.payload.type].orderMessage({
                manager: event.payload.manager,
                type: event.payload.type,
                victim: event.payload.victim
              }),
              type: "info"
            }
          })
        }
      ]
    },
    IMPROVE_ARENA: {
      // Single source of truth for affordability + level cap — the same
      // selector backs the `disabled` prop on the Arena.tsx upgrade button.
      // Sends from anywhere else (dev menu, future bots, future tests) get
      // the same enforcement for free.
      guard: ({ context, event }) =>
        canImproveArena(event.payload.manager)(context),
      actions: [
        {
          type: "executeImproveArena",
          params: ({ event }) => event.payload
        },
        {
          type: "notify",
          params: ({ event }) => ({
            notification: {
              manager: event.payload.manager,
              message:
                "Työmiehet käyttävät vallankumoukselllisia kvanttityövälineitä, ja rakennusurakka valmistuu alta aikayksikön!",
              type: "info"
            }
          })
        }
      ]
    },
    BUY_PLAYER: {
      // UI button (TransferMarket.tsx) is already disabled when the
      // manager can't pay; this guard catches stray sends from elsewhere.
      guard: ({ context, event }) => {
        const playerType = playerTypes[event.payload.playerType];
        return canBuyPlayer(event.payload.manager, playerType.buy)(context);
      },
      actions: {
        type: "executeBuyPlayer",
        params: ({ event }) => event.payload
      }
    },
    SELL_PLAYER: [
      // Happy path: team can spare the strength.
      {
        guard: ({ context, event }) =>
          canSellPlayer(event.payload.manager)(context),
        actions: {
          type: "executeSellPlayer",
          params: ({ event }) => event.payload
        }
      },
      // Failure path: preserve the legacy "myyntilupa evätty" feedback
      // instead of silently swallowing the click.
      {
        actions: {
          type: "notify",
          params: ({ event }) => ({
            notification: {
              manager: event.payload.manager,
              message:
                "Johtokunnan mielestä pelaajien myynti ei ole ratkaisu tämänhetkisiin ongelmiimme. Myyntilupa evätty.",
              type: "error"
            }
          })
        }
      }
    ],
    TEAM_INCUR_PENALTY: {
      actions: {
        type: "executeIncurPenalty",
        params: ({ event }) => event.payload
      }
    },
    SAVED: {
      actions: {
        type: "notify",
        params: ({ context }) => ({
          notification: {
            manager: context.manager.active!,
            message: "Peli tallennettiin.",
            type: "info"
          }
        })
      }
    }
  },
  states: {
    in_game: {
      initial: "executing_phases",
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
            // Compound gameday state: the user previews the matches,
            // advances to start the simulation, then sees the results and
            // advances again to leave the phase. `play` is transient — its
            // `entry` will run the simulation synchronously once the
            // gameday port lands; for now it just falls through so the
            // existing saga keeps doing the work.
            gameday: {
              initial: "preview",
              onDone: "calculations_check",
              states: {
                preview: {
                  on: { ADVANCE: "play" }
                },
                play: {
                  always: "results"
                },
                results: {
                  on: { ADVANCE: "done" }
                },
                done: { type: "final" }
              }
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
                          type: "notify",
                          params: ({ event }) => ({
                            notification: {
                              manager: event.payload.manager,
                              message:
                                "Kiikutat mestarusveikkauskuponkisi S-kioskille. Olkoon onni myötä!",
                              type: "info"
                            }
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
              entry: "executeSeedPhase",
              always: { target: "gala_check" }
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
