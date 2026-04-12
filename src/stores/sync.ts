import type { Middleware } from "redux";
import { uiStore } from "./ui";
import { countryStore } from "./country";
import { notificationStore } from "./notification";
import { toggleMenu, closeMenu } from "@/ducks/ui";
import { setStrength, alterStrength } from "@/ducks/country";
import { addNotification, dismissNotification } from "@/ducks/notification";
import { quitToMainMenu } from "@/ducks/meta";

/**
 * Redux middleware that forwards relevant Redux actions to XState stores.
 * This is the dual-write bridge: sagas dispatch Redux actions, the middleware
 * keeps XState stores in sync. Components read from XState stores.
 *
 * Temporary — will be removed when sagas are migrated to XState machines.
 */
export const xstoreSyncMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);

  if (toggleMenu.match(action)) {
    uiStore.send({ type: "toggleMenu" });
    return result;
  }

  if (closeMenu.match(action)) {
    uiStore.send({ type: "closeMenu" });
    return result;
  }

  if (setStrength.match(action)) {
    countryStore.send({ type: "setStrength", ...action.payload });
    return result;
  }

  if (alterStrength.match(action)) {
    countryStore.send({ type: "alterStrength", ...action.payload });
    return result;
  }

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

  if (quitToMainMenu.match(action)) {
    uiStore.send({ type: "reset" });
    countryStore.send({ type: "reset" });
    notificationStore.send({ type: "reset" });
    return result;
  }

  return result;
};
