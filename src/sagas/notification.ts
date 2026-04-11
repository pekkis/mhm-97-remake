import { put, call, spawn, delay } from "typed-redux-saga";
import {
  addNotification as addNotificationAction,
  dismissNotification as dismissNotificationAction
} from "../ducks/notification";

export function* autoDismissal(id: string) {
  yield* delay(7000);
  yield* call(dismissNotification, id);
}

export function* addNotification(
  manager: string,
  message: string,
  type: string = "info"
) {
  const id = crypto.randomUUID();

  yield* put(
    addNotificationAction({
      id,
      manager,
      message,
      type
    })
  );

  yield* spawn(autoDismissal, id);
}

export function* dismissNotification(id: string) {
  yield* put(dismissNotificationAction(id));
}
