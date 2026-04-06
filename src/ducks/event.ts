import { produce } from "immer";
import type { BaseEventFields } from "../types/base";
import { META_QUIT_TO_MAIN_MENU, META_GAME_LOAD_STATE } from "./meta";

export type StoredEvent = BaseEventFields & Record<string, unknown>;

export type EventState = {
  events: Record<string, StoredEvent>;
};

const defaultState: EventState = {
  events: {}
};

type EventAction =
  | { type: typeof META_QUIT_TO_MAIN_MENU }
  | { type: typeof META_GAME_LOAD_STATE; payload: { event: EventState } }
  | { type: "EVENT_ADD"; payload: { event: Omit<StoredEvent, "id"> } }
  | { type: "EVENT_RESOLVE"; payload: { id: string; event: StoredEvent } }
  | { type: "EVENT_CLEAR_EVENTS" }
  | { type: "EVENT_SET_PROCESSED"; payload: { id: string } };

type ResolveEventAction = {
  type: "EVENT_RESOLVE_REQUEST";
  payload: {
    event: StoredEvent;
    value: string;
  };
};

export const resolveEvent = (
  event: StoredEvent,
  value: string
): ResolveEventAction => {
  return {
    type: "EVENT_RESOLVE_REQUEST",
    payload: {
      event,
      value
    }
  };
};

const eventReducer = (
  state: EventState = defaultState,
  action: EventAction
): EventState => {
  switch (action.type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case META_GAME_LOAD_STATE:
      return action.payload.event;

    case "EVENT_ADD": {
      const id = crypto.randomUUID();
      return produce(state, (draft) => {
        draft.events[id] = { ...action.payload.event, id } as StoredEvent;
      });
    }

    case "EVENT_RESOLVE":
      return produce(state, (draft) => {
        draft.events[action.payload.id] = action.payload.event;
      });

    case "EVENT_CLEAR_EVENTS":
      return { ...state, events: {} };

    case "EVENT_SET_PROCESSED":
      return produce(state, (draft) => {
        draft.events[action.payload.id].processed = true;
      });

    default:
      return state;
  }
};

export default eventReducer;
