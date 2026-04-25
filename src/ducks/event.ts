import { createAction, createReducer } from "@reduxjs/toolkit";
import type { EventState, StoredEvent } from "@/state/event";
import { quitToMainMenu, gameLoadState } from "./meta";
import { syncFromMachine } from "./game";

const defaultState: EventState = {
  events: {},
};

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
}>("EVENT_RESOLVE_REQUEST");

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(gameLoadState, (_state, action) => action.payload.event)
    .addCase(syncFromMachine, (_state, action) => action.payload.event)
    .addCase(addEventAction, (state, action) => {
      const id = crypto.randomUUID();
      state.events[id] = { ...action.payload.event, id } as StoredEvent;
    })
    .addCase(resolveEventAction, (state, action) => {
      state.events[action.payload.id] = action.payload.event;
    })
    .addCase(clearEvents, (state) => {
      state.events = {};
    })
    .addCase(setEventProcessed, (state, action) => {
      state.events[action.payload.id].processed = true;
    });
});
