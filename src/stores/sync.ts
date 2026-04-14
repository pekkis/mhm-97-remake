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
import { seasonStart, setGamePhase, sagaPhaseComplete } from "@/ducks/game";
import type { RootState } from "@/config/redux";
import type { GameContext } from "@/machines/types";

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

    // When a saga phase function completes, sync Redux state → gameMachine
    // context, then forward PHASE_COMPLETE to advance the machine's round
    // lifecycle. SYNC_CONTEXT must arrive before PHASE_COMPLETE so that
    // when the machine transitions to the next phase, its context is fresh.
    if (sagaPhaseComplete.match(action)) {
      const actor = getGameActor();
      if (actor) {
        const state = store.getState() as RootState;
        const ctx = deriveGameContext(state);
        actor.send({ type: "SYNC_CONTEXT", context: ctx });
        actor.send({ type: "PHASE_COMPLETE" });
      }
      return result;
    }

    return result;
  };
