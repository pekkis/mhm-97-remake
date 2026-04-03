import { countries as countryList } from "../data/countries";
import { produce } from "immer";
import { MetaQuitToMainMenuAction, META_QUIT_TO_MAIN_MENU } from "./meta";
import { Reducer } from "redux";

type Country = {
  iso: string;
  name: string;
  strength: number | undefined;
};

type CountryState = {
  countries: Record<string, Country>;
};

const defaultState: CountryState = {
  countries: Object.values(countryList).reduce((acc, country) => {
    acc[country.iso] = {
      ...country,
      strength: country.strength()
    };
    return acc;
  }, {} as Record<string, Country>)
};

const COUNTRY_ALTER_STRENGTH = "COUNTRY_ALTER_STRENGTH";
const COUNTRY_SET_STRENGTH = "COUNTRY_SET_STRENGTH";

type CountryAlterStrengthAction = {
  type: typeof COUNTRY_ALTER_STRENGTH;
  payload: {
    country: string;
    amount: number;
  };
};

type CountrySetStrengthAction = {
  type: typeof COUNTRY_SET_STRENGTH;
  payload: {
    country: string;
    strength: number;
  };
};

export const alterStrength = (
  country: string,
  amount: number
): CountryAlterStrengthAction => ({
  type: COUNTRY_ALTER_STRENGTH,
  payload: {
    country,
    amount
  }
});

export const setStrength = (
  country: string,
  strength: number
): CountrySetStrengthAction => ({
  type: COUNTRY_SET_STRENGTH,
  payload: {
    country,
    strength
  }
});

type CountryActions =
  | CountryAlterStrengthAction
  | MetaQuitToMainMenuAction
  | CountrySetStrengthAction;

const countryReducer: Reducer<CountryState, CountryActions> = (
  state = defaultState,
  action
) => {
  switch (action.type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case COUNTRY_SET_STRENGTH:
      return produce(state, draft => {
        if (draft.countries[action.payload.country]) {
          draft.countries[action.payload.country].strength =
            action.payload.strength;
        }
      });

    case COUNTRY_ALTER_STRENGTH:
      return produce(state, draft => {
        const target = draft.countries[action.payload.country];
        if (target) {
          target.strength = (target.strength ?? 0) + action.payload.amount;
        }
      });

    default:
      return defaultState;
  }
};

export default countryReducer;
