import { select, call, put, take, takeEvery, cancel } from "typed-redux-saga";
import events from "../../data/events";
import { resolveEvent, processEvents } from "../event";
import type { RootState } from "../../config/redux";
import type { StoredEvent } from "../../ducks/event";

export default function* eventPhase() {
  yield* put({
    type: "GAME_SET_PHASE" as const,
    payload: "event"
  });

  yield* put({
    type: "UI_DISABLE_ADVANCE" as const
  });

  const autoresolveEvents = yield* select((state: RootState) =>
    Object.values(state.event.events).filter(
      (e) => !e.resolved && e.autoResolve
    )
  );

  for (const event of autoresolveEvents) {
    const eventObj = events[event.eventId as string];
    yield eventObj.resolve(event);
  }

  const resolver = yield* takeEvery(
    "EVENT_RESOLVE_REQUEST" as any,
    resolveEvent
  );

  let unresolved: number;
  do {
    unresolved = yield* select(
      (state: RootState) =>
        Object.values(state.event.events).filter((e) => !e.resolved).length
    );

    if (unresolved) {
      yield* take("EVENT_RESOLVE");
    }
  } while (unresolved);

  yield* cancel(resolver);

  yield* call(processEvents);

  yield* put({
    type: "UI_ENABLE_ADVANCE" as const
  });
}
