import type { Middleware } from "redux";
import { uiStore } from "./ui";
import { countryStore } from "./country";
import { notificationStore } from "./notification";

/**
 * Redux middleware that forwards relevant Redux actions to XState stores.
 * This is the dual-write bridge: sagas dispatch Redux actions, the middleware
 * keeps XState stores in sync. Components read from XState stores.
 *
 * Temporary — will be removed when sagas are migrated to XState machines.
 */
export const xstoreSyncMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);

  const act = action as { type: string; payload?: unknown };

  switch (act.type) {
    // UI actions
    case "UI_MENU_TOGGLE":
      uiStore.send({ type: "toggleMenu" });
      break;
    case "UI_MENU_CLOSE":
      uiStore.send({ type: "closeMenu" });
      break;

    // Country actions
    case "COUNTRY_SET_STRENGTH":
      countryStore.send({
        type: "setStrength",
        ...(act.payload as { country: string; strength: number })
      });
      break;
    case "COUNTRY_ALTER_STRENGTH":
      countryStore.send({
        type: "alterStrength",
        ...(act.payload as { country: string; amount: number })
      });
      break;

    // Notification actions
    case "NOTIFICATION_ADD": {
      const notification = act.payload as {
        id: string;
        manager: string;
        message: string;
        type: string;
      };
      notificationStore.send({
        type: "addNotification",
        notification
      });
      break;
    }
    case "NOTIFICATION_DISMISS":
      notificationStore.send({
        type: "dismissNotification",
        id: act.payload as string
      });
      break;

    // Cross-duck reset: quitToMainMenu resets all three stores
    case "META_QUIT_TO_MAIN_MENU":
      uiStore.send({ type: "reset" });
      countryStore.send({ type: "reset" });
      notificationStore.send({ type: "reset" });
      break;
  }

  return result;
};
