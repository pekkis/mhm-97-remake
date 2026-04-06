import { Map } from "immutable";

const defaultState = Map({
  events: Map()
});

export const resolveEvent = (event, value) => {
  return {
    type: "EVENT_RESOLVE_REQUEST",
    payload: {
      event,
      value
    }
  };
};

export default function eventReducer(state = defaultState, action) {
  const { type, payload } = action;

  switch (type) {
    case "META_QUIT_TO_MAIN_MENU":
      return defaultState;

    case "META_GAME_LOAD_STATE":
      return payload.event;

    case "EVENT_ADD":
      const id = crypto.randomUUID();
      const eventMap = Map.isMap(payload.event)
        ? payload.event
        : Map(payload.event);
      return state.setIn(["events", id], eventMap.set("id", id));

    case "EVENT_RESOLVE":
      return state.setIn(["events", payload.id], payload.event);

    case "EVENT_CLEAR_EVENTS":
      return state.set("events", Map());

    case "EVENT_SET_PROCESSED":
      return state.setIn(["events", payload.id, "processed"], true);

    default:
      return state;
  }
}
