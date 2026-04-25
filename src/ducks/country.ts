import { countries as countryList } from "@/data/countries";
import { createAction, createReducer } from "@reduxjs/toolkit";
import type { Country, CountryState } from "@/state/country";
import { quitToMainMenu } from "./meta";
import { syncFromMachine } from "./game";
import { values } from "remeda";

const defaultState: CountryState = {
  countries: values(countryList).reduce(
    (acc, country) => {
      acc[country.iso] = {
        ...country,
        strength: country.strength(),
      };
      return acc;
    },
    {} as Record<string, Country>,
  ),
};

export const alterStrength = createAction<{
  country: string;
  amount: number;
}>("COUNTRY_ALTER_STRENGTH");

export const setStrength = createAction<{
  country: string;
  strength: number;
}>("COUNTRY_SET_STRENGTH");

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(syncFromMachine, (_state, action) => action.payload.country)
    .addCase(setStrength, (state, action) => {
      if (state.countries[action.payload.country]) {
        state.countries[action.payload.country].strength =
          action.payload.strength;
      }
    })
    .addCase(alterStrength, (state, action) => {
      const target = state.countries[action.payload.country];
      if (target) {
        target.strength = (target.strength ?? 0) + action.payload.amount;
      }
    });
});
