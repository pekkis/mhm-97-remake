import { setup, assign, sendTo, enqueueActions } from "xstate";
import { produce, type Draft } from "immer";

import type { GameContext } from "@/state";
import type { Manager } from "@/state/manager";
import type { GameResult } from "@/types/competitions";
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
import type { CompetitionId } from "@/types/competitions";
import { values, entries } from "remeda";
import newEvents from "@/game/new-events";
import eventsMap from "@/game/new-events/table";
import type { DeclarativeEvent } from "@/types/event";
import type { BaseEventFields } from "@/types/base";

// Heterogeneous registry lookup — `newEvents` is `as const` for per-event
// payload typing at known keys; the interpreter looks events up by string
// from `eventsMap`, so we widen here. See `new-events/index.ts` for why.
const eventRegistry = newEvents as unknown as Record<
  string,
  DeclarativeEvent<BaseEventFields, { manager: string }> | undefined
>;

// Parlay payout multipliers indexed by number of correct picks (0..6).
// 1-1 mirror of `victories` in src/sagas/betting.ts.
const victories = [false, false, false, 1, 2, 5, 10] as const;

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
    executeGameday: assign(({ context }) =>
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

            // 4. Parlay payouts — PHL phase 0 group 0 only. 1-1 port of
            //    `bettingResults()` in src/sagas/betting.ts.
            //    Bets are NOT cleared (saga doesn't either — stays as-is
            //    until end-of-season teardown).
            if (competitionId === "phl" && comp.phase === 0 && groupIdx === 0) {
              const correctCoupon = pairings.map((p) => {
                const f = resultFacts(p.result!, "home");
                if (f.isWin) {
                  return "1";
                }
                if (f.isDraw) {
                  return "x";
                }
                return "2";
              });

              for (const bet of draft.betting.bets) {
                const correct = bet.coupon.filter(
                  (c, i) => c === correctCoupon[i]
                ).length;
                const multiplier = victories[correct];
                const m = draft.manager.managers[bet.manager];
                if (!draft.news.announcements[bet.manager]) {
                  draft.news.announcements[bet.manager] = [];
                }
                if (multiplier) {
                  const win = Math.round(multiplier * bet.amount);
                  if (m) {
                    m.balance += win;
                  }
                  draft.news.announcements[bet.manager].push(
                    `Voitit kavioveikkauksessa __${formatAmount(
                      win
                    )}__ pekkaa. Rivissäsi oli __${correct}__ oikein. Panoksesi oli __${formatAmount(
                      bet.amount
                    )}__ pekkaa.`
                  );
                } else {
                  draft.news.announcements[bet.manager].push(
                    `Et voittanut kavioveikkauksessa. Rivissäsi oli __${correct}__ oikein. Panoksesi oli __${formatAmount(
                      bet.amount
                    )}__ pekkaa.`
                  );
                }
              }
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
    ),

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
     * 1-1 port of `eventCreationPhase()` in
     * `src/sagas/phase/event-creation.ts` (REFERENCE-ONLY post-pivot),
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

          const hardCodedEventName = "kasino";

          const eventDef = eventRegistry[hardCodedEventName];

          console.log("HAHA HEHE", eventDef);

          if (!eventDef) {
            continue;
          } // not yet ported — silent no-op

          const payload = eventDef.create(context, { manager: manager.id });
          if (!payload) {
            continue;
          }

          const id = crypto.randomUUID();
          draft.event.events[id] = { ...payload, id };
        }
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
            // TODO: port the `prankPhase` saga (src/sagas/phase/prank.ts).
            // Each queued prank's `execute()` either enqueues an event
            // (`events[name].create(prank)` → `state.event.events.push(...)`)
            // or applies a team effect (`fixedMatch` → opponentEffects).
            // Auto-advance for now so the round-loop keeps moving.
            prank: {
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
