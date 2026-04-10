import { put, call, spawn, delay } from "typed-redux-saga";

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

  yield* put({
    type: "NOTIFICATION_ADD" as const,
    payload: {
      id,
      manager,
      message,
      type
    }
  });

  yield* spawn(autoDismissal, id);
}

export function* dismissNotification(id: string) {
  yield* put({
    type: "NOTIFICATION_DISMISS" as const,
    payload: id
  });
}
