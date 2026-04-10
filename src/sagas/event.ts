import { put, select } from "typed-redux-saga";
import type { RootState } from "../config/redux";
import type { StoredEvent } from "../ducks/event";

import events from "../data/events";

export function* resolveEvent(action: {
  payload: { event: StoredEvent; value: string };
}) {
  const { event, value } = action.payload;

  const eventObj = events[event.eventId];

  yield* eventObj.resolve(event, value);
}

export function* addEvent(eventData: Omit<StoredEvent, "id">) {
  yield* put({
    type: "EVENT_ADD" as const,
    payload: { event: eventData }
  });
}

export function* resolvedEvent(eventData: StoredEvent) {
  yield* put({
    type: "EVENT_RESOLVE" as const,
    payload: {
      id: eventData.id,
      event: eventData
    }
  });
}

export function* processEvents() {
  const eventsToProcess = yield* select((state: RootState) =>
    Object.values(state.event.events).filter((e) => e.resolved && !e.processed)
  );

  for (const event of eventsToProcess) {
    yield* events[event.eventId].process(event);
    yield* put({
      type: "EVENT_SET_PROCESSED" as const,
      payload: {
        id: event.id
      }
    });
  }
}
