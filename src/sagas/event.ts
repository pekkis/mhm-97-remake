import { put, select } from "typed-redux-saga";
import type { RootState } from "../config/redux";
import {
  addEventAction,
  resolveEventAction,
  setEventProcessed,
  type StoredEvent
} from "../ducks/event";

import events from "@/game/events";

export function* resolveEvent(action: {
  payload: { event: StoredEvent; value: string };
}) {
  const { event, value } = action.payload;

  const eventObj = events[event.eventId];

  yield* eventObj.resolve(event, value);
}

export function* addEvent(eventData: Omit<StoredEvent, "id">) {
  yield* put(addEventAction({ event: eventData }));
}

export function* resolvedEvent(eventData: StoredEvent) {
  yield* put(
    resolveEventAction({
      id: eventData.id,
      event: eventData
    })
  );
}

export function* processEvents() {
  const eventsToProcess = yield* select((state: RootState) =>
    Object.values(state.event.events).filter((e) => e.resolved && !e.processed)
  );

  for (const event of eventsToProcess) {
    yield* events[event.eventId].process(event);
    yield* put(setEventProcessed({ id: event.id }));
  }
}
