import { put, select } from "redux-saga/effects";

import events from "../data/events";

export function* resolveEvent(action) {
  const { event, value } = action.payload;

  const eventObj = events[event.eventId];

  yield eventObj.resolve(event, value);
}

export function* addEvent(eventData) {
  yield put({
    type: "EVENT_ADD",
    payload: { event: eventData }
  });
}

export function* resolvedEvent(eventData) {
  yield put({
    type: "EVENT_RESOLVE",
    payload: {
      id: eventData.id,
      event: eventData
    }
  });
}

export function* processEvents() {
  const eventsToProcess = yield select((state) =>
    Object.values(state.event.events).filter((e) => e.resolved && !e.processed)
  );

  for (const event of eventsToProcess) {
    yield events[event.eventId].process(event);
    yield put({
      type: "EVENT_SET_PROCESSED",
      payload: {
        id: event.id
      }
    });
  }
}
