import { countryData } from "../data/countries";
import { quitToMainMenu } from "./meta";
import { createAction, createReducer } from "@reduxjs/toolkit";

import { mapValues } from "remeda";
import { Country, CountryCodes } from "../types/base";
import { produce } from "immer";

// console.log("Q", quitToMainMenu);

type CountryState = {
  countries: Record<CountryCodes, Country>;
};

const defaultState = {
  countries: mapValues(countryData, (data) => {
    return {
      iso: data.iso,
      strength: data.strength(),
      name: data.name
    };
  })
} satisfies CountryState;

export const alterStrength = createAction(
  "COUNTRY_ALTER_STRENGTH",
  (country: CountryCodes, amount: number) => ({
    payload: {
      country,
      amount
    }
  })
);

export const setStrength = createAction(
  "COUNTRY_SET_STRENGTH",
  (country: CountryCodes, strength: number) => ({
    payload: {
      country,
      strength
    }
  })
);

const countryReducer = createReducer(defaultState, (builder) => {
  builder.addCase(quitToMainMenu, () => {
    return defaultState;
  });

  builder.addCase(setStrength, (state, action) => {
    return produce(state, (draft) => {
      draft.countries[action.payload.country].strength =
        action.payload.strength;
    });
  });

  builder.addCase(alterStrength, (state, action) => {
    return produce(state, (draft) => {
      draft.countries[action.payload.country].strength += action.payload.amount;
    });
  });
});

export default countryReducer;
