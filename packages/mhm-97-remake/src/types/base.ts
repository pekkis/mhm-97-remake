import { Effect } from "redux-saga/effects";
import { List } from "immutable";

export type MHMEventTypes = "manager";

export type MHMEventGenerator = Generator<Effect, void, unknown>;

export interface MHMEvent {
  type: MHMEventTypes;
  create: (data: any) => MHMEventGenerator;
  render: (data: any) => List<string>;
  process: (data: any) => MHMEventGenerator;
}

export type CountryCodes =
  | "FI"
  | "CA"
  | "US"
  | "SE"
  | "FR"
  | "CZ"
  | "SK"
  | "RU"
  | "DE"
  | "LV"
  | "IT"
  | "CH";

export type Country = {
  iso: CountryCodes;
  name: string;
  strength: number;
};
