import { put, call, spawn } from "redux-saga/effects";
import delay from "@redux-saga/delay-p";
import { v4 as uuid } from "uuid";

export function* autoDismissal(id) {
  yield delay(7000);
  yield call(dismissNotification, id);
}

export function* addNotification(manager, message, type = "info") {
  const id = uuid();

  yield put({
    type: "NOTIFICATION_ADD",
    payload: {
      id,
      manager,
      message,
      type
    }
  });

  yield spawn(autoDismissal, id);
}

export function* dismissNotification(id) {
  yield put({
    type: "NOTIFICATION_DISMISS",
    payload: id
  });
}
