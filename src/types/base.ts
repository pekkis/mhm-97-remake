import type { Effect } from "redux-saga/effects";
import type { Map } from "immutable";

export type MHMEventType = "manager";

export type MHMEventGenerator = Generator<Effect, void, unknown>;

/**
 * Event data as stored in the Redux store.
 * Still Immutable Map during migration — will become a typed plain object per-event later.
 */
export type MHMEventData = Map<string, any>;

export type MHMEvent = {
  type: MHMEventType;
  create: (data: any) => MHMEventGenerator;
  render: (data: MHMEventData) => string[];
  process: (data: MHMEventData) => MHMEventGenerator;
  options?: (data: MHMEventData) => Map<string, string>;
  resolve?: (data: MHMEventData, value: string) => MHMEventGenerator;
};
