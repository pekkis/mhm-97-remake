import { setup, assign, sendTo, enqueueActions, stopChild } from "xstate";
import { produce, type Draft } from "immer";

import type { GameContext } from "@/state";
import type { Manager } from "@/state/manager";
import type { GameResult, TeamStat } from "@/types/competitions";
import {
  managersMainCompetition,
  managerCompetesIn,
  canImproveArena,
  canOrderPrank,
  canBuyPlayer,
  canSellPlayer,
  allEventsResolved,
  randomManager
} from "@/machines/selectors";
import difficultyLevels from "@/data/difficulty-levels";
import teamData from "@/data/teams";
import calendar from "@/data/calendar";
import competitionData from "@/data/competitions";
import tournamentList from "@/data/tournaments";
import { isInvitedToTournament } from "@/machines/tournament-eligibility";
import { computeStats } from "@/services/competition-type";
import competitionTypes from "@/services/competition-type";
import { simulate, gameFacts, resultFacts } from "@/services/game";
import { amount as formatAmount } from "@/services/format";
import strategies from "@/data/strategies";
import services from "@/data/services";
import prankTypes from "@/game/pranks";
import arenas from "@/data/arenas";
import playerTypes from "@/data/transfer-market";
import random from "@/services/random";
import { notificationsMachine } from "@/machines/notifications";
import type { NotificationData } from "@/machines/notification";
import { betMachine } from "@/machines/bet";
import { championBetMachine } from "@/machines/championBet";
import type { CompetitionId } from "@/types/competitions";
import { values, entries } from "remeda";
import newEvents from "@/game/new-events";
import eventsMap from "@/game/new-events/table";
import type { DeclarativeEvent } from "@/types/event";
import type { BaseEventFields, BaseEventCreationFields } from "@/types/base";
import {
  applyEffects,
  type EventEffect,
  type SpawnEventFn,
  type NotifyFn
} from "@/game/event-effects";

// Heterogeneous registry lookup — `newEvents` is `as const` for per-event
// payload typing at known keys; the interpreter looks events up by string
// from `eventsMap`, so we widen here. See `new-events/index.ts` for why.
const eventRegistry = newEvents as unknown as Record<
  string,
  DeclarativeEvent<BaseEventFields, BaseEventCreationFields> | undefined
>;

/**
 * Resolve a `spawnEvent` effect against the registry: build the event's
 * payload via `def.create(ctx, seed)` and push it into the events map.
 * Lives in the machine layer so `event-effects.ts` doesn't need to
 * import the registry (which would form a cycle through every event
 * file). Threaded through `applyEffects(...)`.
 */
const spawnEvent: SpawnEventFn = (draft, eventId, seed) => {
  const def = eventRegistry[eventId];
  if (!def) {
    return;
  }
  const payload = def.create(draft as GameContext, seed);
  if (!payload) {
    return;
  }
  const id = crypto.randomUUID();
  draft.event.events[id] = { ...payload, id };
};

/**
 * One notify-effect collection on its way out of an `enqueueActions`
 * pass. Carries everything the `notifications` child needs except the
 * id (assigned at flush time so each toast gets its own UUID).
 */
type PendingNotification = Omit<NotificationData, "id"> & { timeout?: number };

/**
 * Minimal slice of XState's `enqueue` object that `runInterpreter`
 * touches. Typed loosely so we don't have to thread the full
 * `EnqueueObject<...>` generic stew through here — the call sites
 * (inside `enqueueActions(...)`) already get strong typing for free.
 */
type InterpreterEnqueue = {
  assign: (assigner: GameContext) => void;
  sendTo: (target: string, event: unknown) => void;
};

/**
 * Run an effect-producing body against a fresh draft of `context`,
 * then drain any notifications it queued out to the `notifications`
 * child actor.
 *
 * Encapsulates the "produce + collect + sendTo" dance that every
 * `applyEffects` caller would otherwise repeat. Makes adding new
 * side-effect channels (e.g. `enqueue.spawn(betActor)` once bets are
 * actorized) a one-place change.
 *
 * Notifications can't be a draft mutation — they live in a child
 * actor, not on `GameContext` — so the body collects them through a
 * `NotifyFn` and we forward each one via `sendTo` after `produce()`
 * returns.
 */
function runInterpreter(
  context: GameContext,
  enqueue: InterpreterEnqueue,
  body: (draft: Draft<GameContext>, notify: NotifyFn) => void
): void {
  const pending: PendingNotification[] = [];
  const notify: NotifyFn = (n) => pending.push(n);
  enqueue.assign(
    produce(context, (draft) => {
      body(draft, notify);
    })
  );
  for (const n of pending) {
    enqueue.sendTo("notifications", {
      type: "PUSH" as const,
      notification: { id: crypto.randomUUID(), ...n }
    });
  }
}

// Parlay payout multipliers moved to src/machines/bet.ts (where the
// payout is now computed). The bet actor reaches `resolved` and emits
// `BET_RESOLVED { effects }` which the root handler interprets.

const emptyStreak = { win: 0, draw: 0, loss: 0, noLoss: 0, noWin: 0 } as const;
const emptyGameRecord = { win: 0, draw: 0, loss: 0 } as const;

/**
 * Per-pairing stats bookkeeping. Updates team streaks (W/D/L plus the
 * derived noWin/noLoss counters) and per-manager game records for both
 * sides of a single match. 1-1 port of `gameResultHandler` +
 * `updateFromFacts` reducer in `src/sagas/stats.ts` / `src/ducks/stats.ts`.
 *
 * Mutates `draft.stats` in place — call it from inside `executeGameday`'s
 * `produce()` pass.
 */
function updateStreaks(
  draft: Draft<GameContext>,
  params: {
    competition: string;
    phase: number;
    result: GameResult;
    home: { team: number; manager: string | undefined };
    away: { team: number; manager: string | undefined };
  }
) {
  const stats = draft.stats;
  const phaseKey = params.phase.toString();

  for (const which of ["home", "away"] as const) {
    const { team, manager } = params[which];
    const facts = resultFacts(params.result, which);
    const teamKey = team.toString();

    // Team streaks.
    if (!stats.streaks.team[teamKey]) {
      stats.streaks.team[teamKey] = {};
    }
    if (!stats.streaks.team[teamKey][params.competition]) {
      stats.streaks.team[teamKey][params.competition] = { ...emptyStreak };
    }
    const s = stats.streaks.team[teamKey][params.competition];
    s.win = facts.isWin ? s.win + 1 : 0;
    s.draw = facts.isDraw ? s.draw + 1 : 0;
    s.loss = facts.isLoss ? s.loss + 1 : 0;
    s.noLoss = facts.isWin || facts.isDraw ? s.noLoss + 1 : 0;
    s.noWin = facts.isLoss || facts.isDraw ? s.noWin + 1 : 0;

    // Manager game records (only for managed teams).
    if (manager) {
      if (!stats.managers[manager]) {
        stats.managers[manager] = { games: {} };
      }
      if (!stats.managers[manager].games[params.competition]) {
        stats.managers[manager].games[params.competition] = {};
      }
      if (!stats.managers[manager].games[params.competition][phaseKey]) {
        stats.managers[manager].games[params.competition][phaseKey] = {
          ...emptyGameRecord
        };
      }
      const r = stats.managers[manager].games[params.competition][phaseKey];
      if (facts.isWin) {
        r.win += 1;
      } else if (facts.isLoss) {
        r.loss += 1;
      } else {
        r.draw += 1;
      }
    }
  }
}

/**
 * Resolve a single event, run its `process`, apply the resulting
 * effects, and mark it processed. Used by both `executeAutoResolveEvents`
 * (entry to the event phase) and `executeResolveEvent` (player action).
 *
 * Pure on `draft` — pulls the current event payload from the draft,
 * walks it through the event's `resolve` (if any) and `process`, and
 * writes the result + effects back into the draft.
 *
 * Pre-condition: `evtId` exists in `draft.event.events` and points at
 * an event whose definition exists in `eventRegistry`.
 */
function resolveAndProcess(
  draft: Draft<GameContext>,
  evtId: string,
  value: string,
  notify: NotifyFn
): void {
  const stored = draft.event.events[evtId];
  if (!stored) {
    return;
  }
  const def = eventRegistry[stored.eventId];
  if (!def) {
    return;
  }

  // Resolve only if the event isn't already resolved (some events
  // are pre-resolved at creation time — `pirka`, `bazookaStrike`,
  // anything where the data is fully determined up front). Cast
  // around the registry widening: `def.resolve` is typed against a
  // `BaseEventFields` payload; the stored event is `StoredEvent`
  // (BaseEventFields + extras), which the actual per-event resolve
  // knows how to read.
  if (!stored.resolved) {
    const resolved = def.resolve
      ? def.resolve(draft as GameContext, stored, value)
      : { ...stored, resolved: true };
    // Defensive: ensure the flag is set even if a buggy resolve forgets it.
    draft.event.events[evtId] = { ...resolved, resolved: true, id: evtId };
  }

  // Process. Apply the resulting effect list against the draft so
  // subsequent events in the same pass see the mutations.
  const effects = def.process(
    draft as GameContext,
    draft.event.events[evtId] as never
  );
  applyEffects(draft, effects, spawnEvent, notify);
  draft.event.events[evtId].processed = true;
}

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
  difficulty: number;
  team: number;
};

// One small alias to avoid repeating the generics
export type GameAssign<TParams = undefined> = ReturnType<
  typeof assign<
    GameContext,
    GameMachineEvents,
    TParams,
    GameMachineEvents,
    never
  >
>;

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
      type: "PLACE_BET";
      payload: { manager: string; coupon: string[]; amount: number };
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
  | { type: "DISMISS_NOTIFICATION"; id: string }
  | {
      type: "RESOLVE_EVENT";
      payload: { id: string; value: string };
    }
  | {
      type: "ACCEPT_INVITATION";
      payload: { manager: string; id: string };
    }
  | {
      type: "BET_RESOLVED";
      betId: string;
      effects: EventEffect[];
    };

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    input: {} as GameContext,
    events: {} as GameMachineEvents
  },

  actors: {
    notifications: notificationsMachine,
    bet: betMachine,
    championBet: championBetMachine
  },

  actions: {
    advanceRound: enqueueActions(({ context, enqueue }) => {
      // Stop any parlay bets still parked in `placed` (rounds with no
      // league play never sent them `RESOLVE`, so they'd otherwise leak
      // — XState 5 spawned actors run until explicitly stopped, the GC
      // doesn't reach them via dropped context refs alone).
      for (const ref of context.parlayBets) {
        enqueue(stopChild(ref.id));
      }
      enqueue.assign(
        produce(context, (draft) => {
          for (const team of draft.teams) {
            team.effects = team.effects.filter((e) => e.duration > 0);
            team.opponentEffects = team.opponentEffects.filter(
              (e) => e.duration > 0
            );
          }
          draft.parlayBets = [];
          draft.news.news = [];
          draft.news.announcements = {};
          draft.turn.round += 1;
        })
      );
    }),

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
     * championship_betting — spawn a champion bet actor for the chosen
     * team and debit the stake. The bet sits in `placed` until
     * end-of-season sends it `RESOLVE { champion }`; on resolution it
     * emits `BET_RESOLVED { effects }` which the root handler
     * interprets. Same split-assign pattern as `placeBet`.
     */
    placeChampionBet: enqueueActions(
      (
        { context, enqueue },
        params: { manager: string; team: number; amount: number; odds: number }
      ) => {
        enqueue.assign(
          produce(context, (draft) => {
            const m = draft.manager.managers[params.manager];
            if (m) {
              m.balance -= params.amount;
            }
          })
        );
        enqueue.assign({
          championBets: ({ context, spawn }) => [
            ...context.championBets,
            spawn("championBet", {
              id: `champion-bet-${crypto.randomUUID()}`,
              input: {
                manager: params.manager,
                team: params.team,
                amount: params.amount,
                odds: params.odds
              }
            })
          ]
        });
      }
    ),

    /**
     * invitations_create phase — walk every manager × tournament pair and
     * push an invitation for each one the manager is eligible for.
     * Replaces the previous season's invitation list wholesale (no
     * separate season-start clear needed). 1-1 port of the legacy
     * `createInvitations()` saga.
     *
     * No UI — runs on `entry` and the state auto-advances. Acceptance
     * happens later via the `/kutsut` route firing `ACCEPT_INVITATION`.
     */
    executeInvitationsCreate: assign(({ context }) =>
      produce(context, (draft) => {
        const fresh: typeof draft.invitation.invitations = [];
        for (const managerId of Object.keys(draft.manager.managers)) {
          for (let t = 0; t < tournamentList.length; t++) {
            const { competitionId, maxRanking } = tournamentList[t].eligibility;
            if (
              isInvitedToTournament(
                context,
                competitionId,
                maxRanking,
                managerId
              )
            ) {
              fresh.push({
                id: crypto.randomUUID(),
                manager: managerId,
                tournament: t,
                accepted: false
              });
            }
          }
        }
        draft.invitation.invitations = fresh;
      })
    ),

    /**
     * action phase — spawn a parlay bet actor for the chosen coupon and
     * debit the stake. The bet sits in `placed` until `executeGameday`
     * sends it `RESOLVE { correctCoupon }`; on resolution the bet emits
     * `BET_RESOLVED { effects }` which the root handler interprets.
     *
     * Two `assign`s in one `enqueueActions` so we can keep the immer
     * mutation for the manager balance and add the actor ref to
     * `parlayBets` without immer touching the actor (which would freeze
     * its internal getters). Same split-assign pattern as
     * `executeBuyPlayer`.
     */
    placeBet: enqueueActions(
      (
        { context, enqueue },
        params: { manager: string; coupon: string[]; amount: number }
      ) => {
        enqueue.assign(
          produce(context, (draft) => {
            const m = draft.manager.managers[params.manager];
            if (m) {
              m.balance -= params.amount;
            }
          })
        );
        enqueue.assign({
          parlayBets: ({ context, spawn }) => [
            ...context.parlayBets,
            spawn("bet", {
              id: `bet-${crypto.randomUUID()}`,
              input: {
                manager: params.manager,
                coupon: params.coupon,
                amount: params.amount
              }
            })
          ]
        });
      }
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
     * Play one round of every gameday listed in `calendar[round].gamedays`.
     *
     * Folds the legacy `gameday()` saga + its `completeGameday` helper:
     * for each group, simulate every match where `playMatch` returns true,
     * recompute stats, then run the per-manager `afterGameday`
     * bookkeeping (microphone roll → fine + announcement, plus
     * gameBalance / moraleBoost / readinessBoost), then bump the group's
     * round counter.
     *
     * Still TODO and intentionally NOT in this step:
     *   - `bettingResults` (PHL group 0 only — parlay payouts)
     *   - `groupEnd` (ehl medalists, tournament prizes)
     *
     * Tournaments (and only tournaments — by game-design invariant, regular
     * competitions never share a round with a tournament) play many rounds
     * across this phase. The compound `gameday` state handles that by
     * looping `preview → play → results → preview` until the
     * `tournamentHasMoreRounds` guard returns false.
     */
    executeGameday: enqueueActions(({ context, enqueue }) => {
      // Captured during the league round (PHL phase 0 group 0). After
      // `produce()` returns we send `RESOLVE { correctCoupon }` to every
      // parlay bet actor; each computes its payout and emits
      // `BET_RESOLVED` which the root handler interprets.
      let leagueCorrectCoupon: string[] | undefined;

      enqueue.assign(
        produce(context, (draft) => {
          const round = draft.turn.round;
          const gamedays = calendar[round]?.gamedays ?? [];

          for (const competitionId of gamedays) {
            const comp = draft.competitions[competitionId];
            const phase = comp.phases[comp.phase];
            const ct = competitionTypes[phase.type];
            const competitionDef = competitionData[competitionId];

            for (const [groupIdx, group] of phase.groups.entries()) {
              const groupParams = competitionDef.parameters.gameday(
                comp.phase,
                groupIdx
              );
              const groupRound = group.round;
              const pairings = group.schedule[groupRound];

              // 1. Play every scheduled match.
              for (let x = 0; x < pairings.length; x++) {
                if (!ct.playMatch(group, groupRound, x)) {
                  continue;
                }
                const pairing = pairings[x];
                const home = draft.teams[group.teams[pairing.home]];
                const away = draft.teams[group.teams[pairing.away]];
                const result = simulate({
                  ...groupParams,
                  overtime: ct.overtime,
                  home,
                  away,
                  homeManager: home.manager
                    ? draft.manager.managers[home.manager]
                    : (undefined as unknown as Manager),
                  awayManager: away.manager
                    ? draft.manager.managers[away.manager]
                    : (undefined as unknown as Manager),
                  phaseId: comp.phase,
                  competitionId
                });
                pairing.result = result;

                updateStreaks(draft, {
                  competition: competitionId,
                  phase: comp.phase,
                  result,
                  home: { team: home.id, manager: home.manager },
                  away: { team: away.id, manager: away.manager }
                });
              }

              // 2. Recompute the group's standings.
              group.stats = computeStats(group);

              // 3. Per-manager bookkeeping for the round we just played.
              //    1-1 port of `afterGameday()` in src/sagas/manager.ts.
              for (const [managerId, manager] of entries(
                draft.manager.managers
              )) {
                const managersIndex = group.teams.findIndex(
                  (t) => t === manager.team
                );
                if (managersIndex === -1) {
                  continue;
                }

                const game = group.schedule[groupRound].find(
                  (p) => p.home === managersIndex || p.away === managersIndex
                );
                if (!game || !game.result) {
                  continue;
                }

                // Microphone bust roll: PHL/division phase 0 only, 6%
                // chance → 50000 fine + 4-point penalty (in the league
                // group, hard-coded to phase 0 group 0).
                if (
                  manager.services.microphone &&
                  (competitionId === "phl" || competitionId === "division") &&
                  comp.phase === 0
                ) {
                  if (random.bool(0.06)) {
                    const fine = 50000;
                    const pointDeduction = -4;
                    manager.balance -= fine;
                    // Inline the penalty (port of `incurPenalty` saga +
                    // `teamIncurPenalty` reducer): only applies to
                    // round-robin groups, which the league always is.
                    const leagueGroup =
                      draft.competitions[competitionId].phases[0].groups[0];
                    if (leagueGroup.type === "round-robin") {
                      leagueGroup.penalties.push({
                        team: manager.team!,
                        penalty: pointDeduction
                      });
                      leagueGroup.stats = computeStats(leagueGroup);
                    }
                    if (!draft.news.announcements[managerId]) {
                      draft.news.announcements[managerId] = [];
                    }
                    draft.news.announcements[managerId].push(
                      `"Salainen" mikrofonisi vastustajan vaihtoaitiossa on paljastunut. Teidät tuomitaan __${formatAmount(
                        fine
                      )}__ pekan sakkoihin ja __${pointDeduction}__ pisteen menetykseen.`
                    );
                  }
                }

                const facts = gameFacts(game, managersIndex);
                const team = draft.teams[manager.team!];

                const balanceDelta = competitionDef.gameBalance(
                  comp.phase,
                  facts,
                  manager
                );
                const moraleDelta = competitionDef.moraleBoost(
                  comp.phase,
                  facts,
                  manager
                );
                const readinessDelta = competitionDef.readinessBoost(
                  comp.phase,
                  facts,
                  manager
                );

                if (balanceDelta) {
                  manager.balance += balanceDelta;
                }
                if (readinessDelta) {
                  team.readiness += readinessDelta;
                }
                if (moraleDelta) {
                  // Morale clamp uses the team's manager's difficulty
                  // (defaults to 2 / Pasolini-mode for unmanaged teams).
                  const diffIdx = manager.difficulty;
                  const min = difficultyLevels[diffIdx].moraleMin;
                  const max = difficultyLevels[diffIdx].moraleMax;
                  team.morale = Math.min(
                    max,
                    Math.max(min, team.morale + moraleDelta)
                  );
                }
              }

              // 4. Capture parlay correct coupon — PHL phase 0 group 0
              //    only. Payout happens after `produce()`: we send
              //    `RESOLVE { correctCoupon }` to each parlay bet actor.
              //    Each bet computes its own payout and emits
              //    `BET_RESOLVED { effects }` which the root handler
              //    interprets via `runInterpreter`.
              if (
                competitionId === "phl" &&
                comp.phase === 0 &&
                groupIdx === 0
              ) {
                leagueCorrectCoupon = pairings.map((p) => {
                  const f = resultFacts(p.result!, "home");
                  if (f.isWin) {
                    return "1";
                  }
                  if (f.isDraw) {
                    return "x";
                  }
                  return "2";
                });
              }

              // 5. Advance the group's round counter.
              group.round += 1;

              // 6. groupEnd — when the schedule is exhausted, delegate to
              //    the competition's own end-of-group hook (no-op default).
              //    EHL hands out medalist awards (final phase only);
              //    tournaments disburse the per-tournament prize.
              //    PHL/division omit the hook.
              if (group.round === group.schedule.length) {
                competitionDef.groupEnd?.(draft, {
                  phase: comp.phase,
                  groupIdx,
                  group
                });
              }
            }
          }
        })
      );

      // After produce: dispatch RESOLVE to every parlay bet actor.
      // Each transitions to its `resolved` final state, computes the
      // payout via `computePayout(...)`, and sends `BET_RESOLVED`
      // back to us — the root handler runs the interpreter.
      if (leagueCorrectCoupon) {
        for (const ref of context.parlayBets) {
          enqueue.sendTo(ref, {
            type: "RESOLVE" as const,
            correctCoupon: leagueCorrectCoupon
          });
        }
      }
    }),

    /**
     * Calculations phase — per-team readiness drift from the chosen
     * strategy, per-manager service costs, then duration ticks on every
     * active team effect. 1-1 port of `calculationsPhase()` in
     * `src/sagas/phase/calculations.ts` + the `decrementDurations`
     * reducer case.
     *
     * No UI — runs on `entry` and the state auto-advances.
     */
    executeCalculations: assign(({ context }) =>
      produce(context, (draft) => {
        const turn = draft.turn;
        const basePrices = draft.serviceBasePrices;

        // Per-team: strategy-driven readiness drift.
        for (const team of draft.teams) {
          const delta = strategies[team.strategy].incrementReadiness(turn);
          if (delta !== 0) {
            team.readiness += delta;
          }
        }

        // Per-manager: pay for active services.
        for (const manager of values(draft.manager.managers)) {
          let serviceCosts = 0;
          for (const [serviceId, active] of entries(manager.services)) {
            if (!active) {
              continue;
            }
            serviceCosts += services[serviceId].price(
              basePrices[serviceId],
              manager
            );
          }
          if (serviceCosts !== 0) {
            manager.balance -= serviceCosts;
          }
        }

        // Tick durations on every active effect (team + opponent).
        // Expired effects (duration <= 0 after the tick) are pruned by
        // `advanceRound` at end of round.
        for (const team of draft.teams) {
          for (const e of team.effects) {
            e.duration -= 1;
          }
          for (const e of team.opponentEffects) {
            e.duration -= 1;
          }
        }
      })
    ),

    /**
     * Event creation phase — for each manager, roll one event from
     * `eventsMap` (1-335). If the rolled event is registered in the
     * new declarative registry, build its payload via `create(ctx, …)`
     * and push it into `event.events`. If not yet ported, the roll
     * silently no-ops (the legacy generator-based path is gone).
     *
     * 1-1 port of the deleted `eventCreationPhase()` from
     * `src/sagas/phase/event-creation.ts`,
     * minus the `createRandomEvent` calendar gate — entry to this state
     * is already guarded by `has_phase("event_creation")`, so the gate
     * is redundant.
     *
     * No UI — runs on `entry` and the state auto-advances.
     */
    executeEventCreation: assign(({ context }) =>
      produce(context, (draft) => {
        for (const manager of values(draft.manager.managers)) {
          const eventNumber = random.cinteger(1, 335);
          const eventName = eventsMap[eventNumber];

          if (!eventName) {
            continue;
          }

          // `spawnEvent` no-ops if the event isn't registered yet
          // (most of `eventsMap` until porting completes).
          spawnEvent(draft, eventName, { manager: manager.id });
        }
      })
    ),

    /**
     * Event phase entry — walk every unprocessed event and handle it:
     *   - already-resolved events (e.g. `pirka`, prank-spawned
     *     `bazookaStrike`) → process only.
     *   - unresolved + no `options()` → resolve auto + process.
     *   - unresolved + has `options()` → skip; interactive, wait for
     *     `RESOLVE_EVENT`.
     *
     * Mirrors the deleted saga's two-pass approach (auto-resolve loop in
     * `phase/event.ts` + `processEvents()` in `event.ts`)
     * collapsed into a single walk.
     * "Auto-resolve?" is now a property of the event definition (no
     * `options`) rather than an `autoResolve` flag baked into each
     * payload by the create function.
     */
    executeAutoResolveEvents: enqueueActions(({ context, enqueue }) => {
      runInterpreter(context, enqueue, (draft, notify) => {
        for (const [id, evt] of entries(draft.event.events)) {
          if (evt.processed) {
            continue;
          }
          const def = eventRegistry[evt.eventId];
          if (!def) {
            continue;
          }
          // Interactive event still waiting on the player.
          if (!evt.resolved && def.options) {
            continue;
          }
          resolveAndProcess(draft, id, "auto", notify);
        }
      });
    }),

    /**
     * Player resolved one interactive event. Look it up, run its
     * `resolve` (which may roll random — that's where rolls live in
     * the new system), apply effects from `process`, mark processed.
     *
     * 1-1 port of the deleted `requestResolveEvent` → `resolveEvent` flow
     * in `src/sagas/event.ts`.
     */
    executeResolveEvent: enqueueActions(
      ({ context, enqueue }, params: { id: string; value: string }) => {
        runInterpreter(context, enqueue, (draft, notify) => {
          resolveAndProcess(draft, params.id, params.value, notify);
        });
      }
    ),

    /**
     * Wipe the event queue. Runs on exit from the event phase so the
     * resolved/processed cards stay visible until the player advances
     * out of the phase. Saga equivalent: `clearEvents()` inside
     * `nextTurn()` at end of round.
     */
    executeClearEvents: assign(({ context }) =>
      produce(context, (draft) => {
        draft.event.events = {};
      })
    ),

    /**
     * Gala phase entry — push a stack of news strings narrating the
     * upcoming PHL/division finals before the player enters the final
     * round. 1-1 port of `src/sagas/phase/gala.ts` (REFERENCE-ONLY
     * post-pivot).
     *
     * Reads PHL regular-season + finals brackets, division finals +
     * regular-season brackets, then describes home advantage,
     * favorites, bronze pairing, division ranking surprises, etc.
     *
     * No randomness in the news lines themselves; `randomManager()`
     * is used only as a fallback when an unmanaged team reaches the
     * final.
     */
    executeGalaPhase: assign(({ context }) =>
      produce(context, (draft) => {
        const teams = draft.teams;
        const managers = draft.manager.managers;

        const phlRegularSeason = draft.competitions.phl.phases[0].groups[0];
        const phlFinals = draft.competitions.phl.phases[3].groups[0];
        const divFinals = draft.competitions.division.phases[3].groups[0];
        const divRegularSeason =
          draft.competitions.division.phases[0].groups[0];

        const phlRegStats = phlRegularSeason.stats as TeamStat[];
        const divRegStats = divRegularSeason.stats as TeamStat[];

        const phlLast = teams[phlRegStats[phlRegStats.length - 1].id];
        const phlFinalists = phlFinals.teams.slice(0, 2).map((t) => teams[t]);
        const phlBronzists = phlFinals.teams.slice(-2).map((t) => teams[t]);
        const divFinalists = divFinals.teams.slice(0, 2).map((t) => teams[t]);

        const otherManager = randomManager()(context);

        const push = (line: string) => {
          draft.news.news.push(line);
        };

        push(
          `Ilmassa on jännitystä, finaalijoukkueet ovat viimein pitkän kauden jälkeen selvillä!`
        );

        push(
          `Kotiedun finaalisarjaan saa __${phlFinalists[0].name}__, ${
            phlFinalists[0].strength >=
            phlFinalists[phlFinalists.length - 1].strength
              ? `joka lähtee ennakkosuosikkina tuleviin otteluihin!`
              : `mutta joukkue lähteekin altavastaajana mukaan ja tarvitsee etua.`
          }`
        );

        const finalUnderdog = phlFinalists[phlFinalists.length - 1];
        const theManager = finalUnderdog.manager
          ? managers[finalUnderdog.manager]
          : otherManager;

        push(
          `Toinen loppuottelija on __${finalUnderdog.name}__, jonka manageri _${theManager.name}_ on piiskannut hyvään vauhtiin kuluvalla kaudella.`
        );

        push(
          `Pronssitaistossa vastakkain ovat  __${phlBronzists[0].name}__ ja __${phlBronzists[phlBronzists.length - 1].name}__. Kolmannen sijan merkitystä ei pidä ollenkaan väheksyä, sillä tuohan se mukanaan paikan _europeleihin._`
        );

        const bronze0Rank = phlRegStats.findIndex(
          (s) => s.id === phlBronzists[0].id
        );
        const bronze1Rank = phlRegStats.findIndex(
          (s) => s.id === phlBronzists[phlBronzists.length - 1].id
        );

        if (bronze0Rank === 0) {
          push(
            `__${phlBronzists[0].name}__ voitti runkosarjan, joten sille pronssiotteluun joutuminen on varmasti valtava pettymys.`
          );
        }

        if (bronze0Rank >= 6) {
          push(
            `__${phlBronzists[0].name}__ ylsi hikisesti play-offeihin, ja saa olla tyytyväinen pronssiottelupaikasta!`
          );
        }

        if (bronze1Rank >= 6) {
          push(
            `Runkosarjassa rämpinyt __${phlBronzists[phlBronzists.length - 1].name}__ on ollut yksi myöhäiskevään positiiviisimmista yllättäjistä!`
          );
        }

        push(
          `Nousukarsinnan finaalissa kohtaavat __${divFinalists[0].name}__ ja __${divFinalists[divFinalists.length - 1].name}__.`
        );

        if (phlRegularSeason.teams.includes(divFinalists[0].id)) {
          push(
            `__${divFinalists[0].name}__ on läpikäynyt kovan kauden liigassa, ja voisi olettaa tämän kokemuksen antavan heille edun haastajaa vastaan.`
          );
        } else {
          push(
            `Liigassa pelannut __${phlLast.name}__ ei ole enää mukana nousukarsinnoissa. Kotiedun finaaliin saa siten __${divFinalists[0].name}__`
          );
          push(
            `Liigaseuran semifinaalissa niputtanut __${divFinalists[divFinalists.length - 1].name}__ lähtee todella nälkäisenä finaaliin.`
          );
        }

        for (const divFinalist of divFinalists) {
          const ranking = divRegStats.findIndex((s) => s.id === divFinalist.id);
          if (ranking === 0) {
            push(
              `Divisioonan runkosarjan voittanut __${divFinalist.name}__ katselee myös himokkaasti liigan suuntaan.`
            );
          }
        }

        for (const divFinalist of divFinalists) {
          const ranking = divRegStats.findIndex((s) => s.id === divFinalist.id);
          if (ranking === 4) {
            push(
              `Divisioonassa kovin keskinkertaisesti pärjännyt __${divFinalist.name}__ on yllättänyt kaikki jyräämällä vastuttamattomasti tietänsä ylemmälle sarjatasolle.`
            );
          }
          if (ranking === 5) {
            push(
              `Viimeisenä divarin jatkopeleihin ponnistanut  __${divFinalist.name}__ on härän vimmalla raivannut vastustajansa pois alta. Miten käynee nyt?`
            );
          }
        }
      })
    ),

    /**
     * Prank phase entry — execute every queued prank, applying its
     * effect list (mostly `spawnEvent` → an event lands in
     * `event.events` for the upcoming event phase; `fixedMatch` →
     * direct team-effect debuff). Then clear the queue.
     *
     * 1-1 port of `src/sagas/phase/prank.ts` (REFERENCE-ONLY
     * post-pivot). The `prankExecutor`/`dismissPrank(prankId)` two-step
     * is collapsed into one immer pass.
     *
     * No UI — runs on `entry` and the state auto-advances.
     */
    executePranks: enqueueActions(({ context, enqueue }) => {
      runInterpreter(context, enqueue, (draft, notify) => {
        for (const prank of draft.prank.pranks) {
          const def = prankTypes[prank.type];
          if (!def) {
            continue;
          }
          applyEffects(
            draft,
            def.execute(draft as GameContext, prank),
            spawnEvent,
            notify
          );
        }
        draft.prank.pranks = [];
      });
    }),

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
    calendar_in_bounds: ({ context }) => context.turn.round < calendar.length,
    /**
     * True iff any group in any of the round's gamedays still has rounds
     * left in its schedule. By game-design invariant, this is only ever
     * true for tournaments — regular competitions exhaust their schedule
     * in the single round dedicated to them in the calendar.
     */
    tournamentHasMoreRounds: ({ context }) => {
      const gamedays = calendar[context.turn.round]?.gamedays ?? [];
      for (const id of gamedays) {
        const comp = context.competitions[id];
        const phase = comp.phases[comp.phase];
        // Only tournaments play multiple rounds in a single gameday phase.
        // Round-robin (PHL/division/EHL) plays one schedule-round per
        // calendar gameday, no matter how many rounds the schedule has.
        if (phase.type !== "tournament") {
          continue;
        }
        for (const group of phase.groups) {
          if (group.round < group.schedule.length) {
            return true;
          }
        }
      }
      return false;
    }
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
    PLACE_BET: {
      actions: [
        {
          type: "placeBet",
          params: ({ event }) => event.payload
        },
        {
          type: "notify",
          params: ({ event }) => ({
            notification: {
              manager: event.payload.manager,
              message:
                "Kiikutat veikkauskuponkisi lähimmälle S-kioskille. Olkoon onni myötä!",
              type: "info"
            }
          })
        }
      ]
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
    },
    BET_RESOLVED: {
      // A spawned bet actor (parlay or champion) has reached its
      // `resolved` final state. Interpret its `effects`, drop the ref
      // from whichever list it lived in, and stop the child to release
      // its system-level registration. Filtering both lists is fine —
      // the non-matching list filter is a no-op.
      actions: enqueueActions(({ context, enqueue, event }) => {
        runInterpreter(context, enqueue, (draft, notify) => {
          applyEffects(draft, event.effects, spawnEvent, notify);
        });
        enqueue.assign({
          parlayBets: ({ context }) =>
            context.parlayBets.filter((ref) => ref.id !== event.betId),
          championBets: ({ context }) =>
            context.championBets.filter((ref) => ref.id !== event.betId)
        });
        enqueue(stopChild(event.betId));
      })
    },
    ACCEPT_INVITATION: {
      // The user accepted a tournament invitation from the /kutsut UI.
      // Flip the invitation's `accepted`, drop every other un-accepted
      // invitation for the same manager (accepting one cancels the
      // rest — "sihteerisi vastasi muihin kieltävästi"), add the
      // manager's team to the tournaments competition, and notify.
      // 1-1 port of the legacy `acceptInvitation()` saga.
      actions: enqueueActions(({ context, enqueue, event }) => {
        const { manager, id } = event.payload;
        const teamId = context.manager.managers[manager]?.team;
        runInterpreter(context, enqueue, (draft, notify) => {
          const idx = draft.invitation.invitations.findIndex(
            (i) => i.manager === manager && i.id === id
          );
          if (idx === -1) {
            return;
          }
          draft.invitation.invitations[idx].accepted = true;
          draft.invitation.invitations = draft.invitation.invitations.filter(
            (i) => i.manager !== manager || i.accepted
          );
          if (teamId !== undefined) {
            draft.competitions.tournaments.teams.push(teamId);
          }
          notify({
            manager,
            message:
              "Hyväksyit turnauskutsun. Sihteerisi vastasi kaikkiin muihin potentiaalisiin turnauskutsuihin kieltävästi.",
            type: "info"
          });
        });
      })
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
            // Prank phase — execute every queued prank in one pass.
            // Most pranks `spawnEvent` so their fallout lands in the
            // upcoming event phase; `fixedMatch` directly debuffs the
            // victim. Auto-advances; no UI.
            prank: {
              entry: "executePranks",
              always: "gameday_check"
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
                  entry: "executeGameday",
                  always: "results"
                },
                results: {
                  on: {
                    ADVANCE: [
                      // Tournament still has rounds left — loop back so the
                      // user sees the next round's preview.
                      {
                        guard: "tournamentHasMoreRounds",
                        target: "preview"
                      },
                      // All scheduled play done — exit the gameday phase.
                      { target: "done" }
                    ]
                  }
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
              entry: "executeCalculations",
              always: "event_creation_check"
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
              entry: "executeEventCreation",
              always: "event_check"
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
              entry: "executeAutoResolveEvents",
              exit: "executeClearEvents",
              on: {
                RESOLVE_EVENT: {
                  actions: {
                    type: "executeResolveEvent",
                    params: ({ event }) => event.payload
                  }
                },
                ADVANCE: {
                  // Defense in depth — UI also disables the advance
                  // button via the `advanceEnabled` snapshot selector.
                  guard: ({ context }) => allEventsResolved(context),
                  target: "news_check"
                }
              }
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
                { target: "start_of_season_check" }
              ]
            },
            invitations_create: {
              entry: "executeInvitationsCreate",
              always: "start_of_season_check"
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
              entry: "executeGalaPhase",
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
