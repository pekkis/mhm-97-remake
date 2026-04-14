import type { Middleware } from "redux";
import { uiStore } from "./ui";
import { countryStore } from "./country";
import { notificationStore } from "./notification";
import {
  appActor,
  startGameActor,
  stopGameActor,
  getGameActor
} from "@/machines/actors";
import { toggleMenu, closeMenu } from "@/ducks/ui";
import { setStrength, alterStrength } from "@/ducks/country";
import { addNotification, dismissNotification } from "@/ducks/notification";
import { quitToMainMenu, startGame, loadGame, gameLoaded } from "@/ducks/meta";
import {
  seasonStart,
  setGamePhase,
  sagaPhaseComplete,
  syncFromMachine,
  advance
} from "@/ducks/game";
import type { RootState } from "@/config/redux";
import type { GameContext } from "@/machines/types";
import type { GameMachineContext } from "@/machines/game";

/**
 * Phases where the gameMachine executes logic via `assign()` actions.
 * Sync direction: machine → Redux (via `syncFromMachine`).
 * The saga signals `sagaPhaseComplete` without running phase logic,
 * and the middleware pushes machine context to Redux + sends `PHASE_COMPLETE`.
 */
const MACHINE_COMPUTED_PHASES = new Set(["calculations"]);

/**
 * Phases where the gameMachine waits for user interaction (e.g. ADVANCE).
 * No state mutation occurs — the machine just gates progression.
 * The saga waits for the machine to advance past the phase (via `waitFor`),
 * then signals `sagaPhaseComplete`. The middleware does NOT send
 * `PHASE_COMPLETE` (the machine already advanced via the user's ADVANCE).
 */
const MACHINE_INTERACTIVE_PHASES = new Set(["news"]);

/**
 * Extract `GameContext` from the machine's `GameMachineContext` by
 * stripping machine-internal bookkeeping fields.
 *
 * Used to push machine state → Redux via `syncFromMachine` after
 * the machine executes a phase.
 */
const extractGameContext = (ctx: GameMachineContext): GameContext => ({
  turn: ctx.turn,
  flags: ctx.flags,
  serviceBasePrices: ctx.serviceBasePrices,
  managers: ctx.managers,
  competitions: ctx.competitions,
  teams: ctx.teams,
  worldChampionshipResults: ctx.worldChampionshipResults,
  manager: ctx.manager,
  betting: ctx.betting,
  event: ctx.event,
  news: ctx.news,
  notification: ctx.notification,
  prank: ctx.prank,
  stats: ctx.stats,
  invitation: ctx.invitation,
  country: ctx.country
});

/**
 * Derive a `GameContext` snapshot from the current Redux `RootState`.
 *
 * Used to initialize the game machine's context from Redux state during
 * the dual-write transition, and to keep the machine in sync after each
 * saga phase via `SYNC_CONTEXT`. Once the game machine owns all state,
 * this function will be removed.
 */
export const deriveGameContext = (state: RootState): GameContext => ({
  turn: state.game.turn,
  flags: state.game.flags,
  serviceBasePrices: state.game.serviceBasePrices,
  managers: state.game.managers,
  competitions: state.game.competitions,
  teams: state.game.teams,
  worldChampionshipResults: state.game.worldChampionshipResults,
  manager: state.manager,
  betting: state.betting,
  event: state.event,
  news: state.news,
  notification: state.notification,
  prank: state.prank,
  stats: state.stats,
  invitation: state.invitation,
  country: state.country
});

/**
 * Redux middleware that forwards relevant Redux actions to XState stores
 * and the appMachine actor.
 *
 * This is the dual-write bridge: sagas dispatch Redux actions, the middleware
 * keeps XState stores/machines in sync. Components read from XState.
 *
 * Temporary — will be removed when sagas are migrated to XState machines.
 */
export const xstoreSyncMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);

    // --- UI store ---

    if (toggleMenu.match(action)) {
      uiStore.send({ type: "toggleMenu" });
      return result;
    }

    if (closeMenu.match(action)) {
      uiStore.send({ type: "closeMenu" });
      return result;
    }

    // --- Country store ---

    if (setStrength.match(action)) {
      countryStore.send({ type: "setStrength", ...action.payload });
      return result;
    }

    if (alterStrength.match(action)) {
      countryStore.send({ type: "alterStrength", ...action.payload });
      return result;
    }

    // --- Notification store ---

    if (addNotification.match(action)) {
      notificationStore.send({
        type: "addNotification",
        notification: action.payload
      });
      return result;
    }

    if (dismissNotification.match(action)) {
      notificationStore.send({
        type: "dismissNotification",
        id: action.payload
      });
      return result;
    }

    // --- App machine ---

    if (startGame.match(action)) {
      appActor.send({ type: "START_GAME" });
      return result;
    }

    if (loadGame.match(action)) {
      appActor.send({ type: "LOAD_GAME" });
      return result;
    }

    // GAME_LOADED: transition appMachine + start gameMachine with loaded state
    if (gameLoaded.match(action)) {
      appActor.send({ type: "GAME_LOADED" });
      const state = store.getState() as RootState;
      const ctx = deriveGameContext(state);
      const actor = startGameActor(ctx);
      actor.send({ type: "START" });
      return result;
    }

    // SEASON_START triggers "started: true" in the meta reducer for new games.
    // The appMachine models this as GAME_STARTED (only transitions from "starting").
    // Note: SEASON_START fires every season, not just the first — the appMachine
    // silently ignores it when already in "inGame". Harmless, and goes away
    // when the game machine owns season transitions directly.
    //
    // For the gameMachine: we (re)start it every season. On subsequent seasons
    // the saga's endOfSeason phase has already reset turn.round to 0 in Redux,
    // so deriveGameContext gives us a fresh round-0 context. Without this,
    // the machine walks past calendar[74] into an infinite roundStart↔roundEnd
    // loop (calendar has 75 entries, 0–74).
    if (seasonStart.match(action)) {
      appActor.send({ type: "GAME_STARTED" });

      const state = store.getState() as RootState;
      const ctx = deriveGameContext(state);
      const actor = startGameActor(ctx);
      actor.send({ type: "START" });
      return result;
    }

    // --- Quit: reset all stores + app machine + stop game actor ---

    if (quitToMainMenu.match(action)) {
      uiStore.send({ type: "reset" });
      countryStore.send({ type: "reset" });
      notificationStore.send({ type: "reset" });
      stopGameActor();
      appActor.send({ type: "QUIT" });
      return result;
    }

    // --- Phase tracking bridge (saga → gameMachine observer) ---

    // Bridge user advance button → ADVANCE on game actor.
    // Only forward when the machine is on a machine-interactive phase
    // (e.g. "news"). For saga-owned phases, advance() flows through
    // Redux normally and the saga's `take(advance)` handles it.
    // Without this guard, advance clicks during saga-owned phases
    // (event, gameday, etc.) would double-advance the machine.
    if (advance.match(action)) {
      const actor = getGameActor();
      if (actor) {
        const { currentPhase } = actor.getSnapshot().context;
        if (currentPhase && MACHINE_INTERACTIVE_PHASES.has(currentPhase)) {
          actor.send({ type: "ADVANCE" });
        }
      }
      return result;
    }

    // Forward Redux phase name to game actor for dev observability.
    // The saga sets this via `put(setGamePhase("..."))` during execution.
    // Some phases set sub-phase names (e.g. "select-strategy" within
    // "startOfSeason"), so `reduxPhase` can differ from `currentPhase`.
    if (setGamePhase.match(action)) {
      const actor = getGameActor();
      if (actor) {
        actor.send({ type: "SYNC_REDUX_PHASE", phase: action.payload });
      }
      return result;
    }

    // When a saga phase function completes, sync state between Redux and
    // the gameMachine, then forward PHASE_COMPLETE to advance the machine's
    // round lifecycle.
    //
    // Three categories of phases:
    //
    // 1. Machine-computed phases (e.g. "calculations"):
    //    Machine already ran logic via assign(). Push machine → Redux
    //    (syncFromMachine), then send PHASE_COMPLETE to advance.
    //
    // 2. Machine-interactive phases (e.g. "news"):
    //    Machine already advanced via user's ADVANCE event. No state
    //    mutation occurred. Just sync Redux → machine for consistency.
    //    Do NOT send PHASE_COMPLETE (machine already moved on).
    //
    // 3. Saga-owned phases (everything else):
    //    Saga ran the logic. Push Redux → machine (SYNC_CONTEXT),
    //    then send PHASE_COMPLETE to advance.
    if (sagaPhaseComplete.match(action)) {
      const actor = getGameActor();
      if (actor) {
        const phase = action.payload.phase;

        if (MACHINE_COMPUTED_PHASES.has(phase)) {
          // Machine already executed this phase — push machine → Redux
          const machineCtx = extractGameContext(actor.getSnapshot().context);
          store.dispatch(syncFromMachine(machineCtx));
          actor.send({ type: "PHASE_COMPLETE" });
        } else if (MACHINE_INTERACTIVE_PHASES.has(phase)) {
          // Machine already advanced via ADVANCE — just sync Redux → machine
          // for context consistency. Do NOT send PHASE_COMPLETE.
          const state = store.getState() as RootState;
          const ctx = deriveGameContext(state);
          actor.send({ type: "SYNC_CONTEXT", context: ctx });
        } else {
          // Saga executed this phase — push Redux → machine
          const state = store.getState() as RootState;
          const ctx = deriveGameContext(state);
          actor.send({ type: "SYNC_CONTEXT", context: ctx });
          actor.send({ type: "PHASE_COMPLETE" });
        }
      }
      return result;
    }

    return result;
  };
