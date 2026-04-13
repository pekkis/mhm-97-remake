import { countries as countryList } from "@/data/countries";
import { createAction, createReducer } from "@reduxjs/toolkit";
import { quitToMainMenu } from "./meta";
import { syncFromMachine } from "./game";
import { values } from "remeda";

export type Country = {
  iso: string;
  name: string;
  strength: number | undefined;
};

type CountryState = {
  countries: Record<string, Country>;
};

const defaultState: CountryState = {
  countries: values(countryList).reduce(
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
    .addCase(syncFromMachine, (_state, action) => ({
      countries: action.payload.country
    }))
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
