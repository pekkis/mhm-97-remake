import { select, call, put, take, takeEvery, cancel } from "redux-saga/effects";
import events from "../../data/events";
import { resolveEvent, processEvents } from "../event";

export default function* eventPhase() {
  yield put({
    type: "GAME_SET_PHASE",
    payload: "event"
  });

  yield put({
    type: "UI_DISABLE_ADVANCE"
  });

  const autoresolveEvents = yield select((state) =>
    Object.values(state.event.events).filter(
      (e) => !e.resolved && e.autoResolve
    )
  );

  for (const event of autoresolveEvents) {
    const eventObj = events[event.eventId];
    yield eventObj.resolve(event);
  }

  const resolver = yield takeEvery("EVENT_RESOLVE_REQUEST", resolveEvent);

  let unresolved;
  do {
    unresolved = yield select(
      (state) =>
        Object.values(state.event.events).filter((e) => !e.resolved).length
    );

    if (unresolved) {
      yield take("EVENT_RESOLVE");
    }
  } while (unresolved);

  yield cancel(resolver);

  yield call(processEvents);

  yield put({
    type: "UI_ENABLE_ADVANCE"
  });
}
