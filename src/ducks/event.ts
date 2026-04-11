import { produce } from "immer";
import { createAction } from "@reduxjs/toolkit";
import type { BaseEventFields } from "../types/base";
import { META_QUIT_TO_MAIN_MENU, META_GAME_LOAD_STATE } from "./meta";

export type StoredEvent = BaseEventFields & Record<string, unknown>;

export type EventState = {
  events: Record<string, StoredEvent>;
};

const defaultState: EventState = {
  events: {}
};

export const EVENT_RESOLVE_REQUEST = "EVENT_RESOLVE_REQUEST";

export const addEventAction = createAction<{
  event: Omit<StoredEvent, "id">;
}>("EVENT_ADD");

export const resolveEventAction = createAction<{
  id: string;
  event: StoredEvent;
}>("EVENT_RESOLVE");

export const clearEvents = createAction("EVENT_CLEAR_EVENTS");

export const setEventProcessed = createAction<{
  id: string;
}>("EVENT_SET_PROCESSED");

export const requestResolveEvent = createAction<{
  event: StoredEvent;
  value: string;
}>(EVENT_RESOLVE_REQUEST);

export default function eventReducer(
  state: EventState = defaultState,
  action: any
): EventState {
  switch (action.type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case META_GAME_LOAD_STATE:
      return action.payload.event;

    case addEventAction.type: {
      const id = crypto.randomUUID();
      return produce(state, (draft) => {
        draft.events[id] = { ...action.payload.event, id } as StoredEvent;
      });
    }

    case resolveEventAction.type:
      return produce(state, (draft) => {
        draft.events[action.payload.id] = action.payload.event;
      });

    case clearEvents.type:
      return { ...state, events: {} };

    case setEventProcessed.type:
      return produce(state, (draft) => {
        draft.events[action.payload.id].processed = true;
      });

    default:
      return state;
  }
}
