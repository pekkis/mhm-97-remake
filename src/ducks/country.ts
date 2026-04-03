import { countries as countryList } from "../data/countries";
import { Map } from "immutable";
import { MetaQuitToMainMenuAction, META_QUIT_TO_MAIN_MENU } from "./meta";
import { Reducer } from "redux";

const defaultState = Map({
  countries: Map(
    Object.values(countryList).map(country => [
      country.iso,
      Map({
        ...country,
        strength: country.strength()
      })
    ])
  )
});

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

const countryReducer: Reducer<typeof defaultState, CountryActions> = (
  state = defaultState,
  action
) => {
  switch (action.type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case COUNTRY_SET_STRENGTH:
      return state.setIn(
        ["countries", action.payload.country, "strength"],
        action.payload.strength
      );

    case COUNTRY_ALTER_STRENGTH:
      return state.updateIn(
        ["countries", action.payload.country, "strength"],
        s => ((s as number | undefined) ?? 0) + action.payload.amount
      );

    default:
      return defaultState;
  }
};

export default countryReducer;
