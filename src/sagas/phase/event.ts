import { select, call, put, take, takeEvery, cancel } from "typed-redux-saga";
import events from "../../data/events";
import { resolveEvent, processEvents } from "../event";
import { setGamePhase } from "../../ducks/game";
import { requestResolveEvent } from "../../ducks/event";
import { disableAdvance, enableAdvance } from "../../ducks/ui";
import type { RootState } from "../../config/redux";
import type { StoredEvent } from "../../ducks/event";

export default function* eventPhase() {
  yield* put(setGamePhase("event"));

  yield* put(disableAdvance());

  const autoresolveEvents = yield* select((state: RootState) =>
    Object.values(state.event.events).filter(
      (e) => !e.resolved && e.autoResolve
    )
  );

  for (const event of autoresolveEvents) {
    const eventObj = events[event.eventId as string];
    yield eventObj.resolve(event);
  }

  const resolver = yield* takeEvery(requestResolveEvent, resolveEvent);

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

  yield* put(enableAdvance());
}
