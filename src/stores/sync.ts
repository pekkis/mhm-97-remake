import type { Middleware } from "redux";
import { uiStore } from "./ui";
import { countryStore } from "./country";
import { notificationStore } from "./notification";
import { appActor } from "@/machines/app";
import { toggleMenu, closeMenu } from "@/ducks/ui";
import { setStrength, alterStrength } from "@/ducks/country";
import { addNotification, dismissNotification } from "@/ducks/notification";
import {
  quitToMainMenu,
  startGame,
  loadGame,
  gameLoaded
} from "@/ducks/meta";
import { seasonStart } from "@/ducks/game";

/**
 * Redux middleware that forwards relevant Redux actions to XState stores
 * and the appMachine actor.
 *
 * This is the dual-write bridge: sagas dispatch Redux actions, the middleware
 * keeps XState stores/machines in sync. Components read from XState.
 *
 * Temporary — will be removed when sagas are migrated to XState machines.
 */
export const xstoreSyncMiddleware: Middleware = () => (next) => (action) => {
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

  if (gameLoaded.match(action)) {
    appActor.send({ type: "GAME_LOADED" });
    return result;
  }

  // SEASON_START triggers "started: true" in the meta reducer for new games.
  // The appMachine models this as GAME_STARTED (only transitions from "starting").
  if (seasonStart.match(action)) {
    appActor.send({ type: "GAME_STARTED" });
    return result;
  }

  // --- Quit: reset all stores + app machine ---

  if (quitToMainMenu.match(action)) {
    uiStore.send({ type: "reset" });
    countryStore.send({ type: "reset" });
    notificationStore.send({ type: "reset" });
    appActor.send({ type: "QUIT" });
    return result;
  }

  return result;
};
