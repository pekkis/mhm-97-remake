import { countries as countryList } from "../data/countries";
import { produce } from "immer";
import { createAction } from "@reduxjs/toolkit";
import { META_QUIT_TO_MAIN_MENU } from "./meta";

export type Country = {
  iso: string;
  name: string;
  strength: number | undefined;
};

type CountryState = {
  countries: Record<string, Country>;
};

const defaultState: CountryState = {
  countries: Object.values(countryList).reduce(
    (acc, country) => {
      acc[country.iso] = {
        ...country,
        strength: country.strength()
      };
      return acc;
    },
    {} as Record<string, Country>
  )
};

const COUNTRY_ALTER_STRENGTH = "COUNTRY_ALTER_STRENGTH";
const COUNTRY_SET_STRENGTH = "COUNTRY_SET_STRENGTH";

export const alterStrength = createAction<{
  country: string;
  amount: number;
}>(COUNTRY_ALTER_STRENGTH);

export const setStrength = createAction<{
  country: string;
  strength: number;
}>(COUNTRY_SET_STRENGTH);

export default function countryReducer(
  state: CountryState = defaultState,
  action: any
): CountryState {
  switch (action.type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case COUNTRY_SET_STRENGTH:
      return produce(state, (draft) => {
        if (draft.countries[action.payload.country]) {
          draft.countries[action.payload.country].strength =
            action.payload.strength;
        }
      });

    case COUNTRY_ALTER_STRENGTH:
      return produce(state, (draft) => {
        const target = draft.countries[action.payload.country];
        if (target) {
          target.strength = (target.strength ?? 0) + action.payload.amount;
        }
      });

    default:
      return defaultState;
  }
}
