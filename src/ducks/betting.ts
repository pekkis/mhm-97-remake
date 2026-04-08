import { produce } from "immer";
import { META_QUIT_TO_MAIN_MENU, META_GAME_LOAD_STATE } from "./meta";
import { SEASON_START, GAME_NEXT_TURN } from "./game";

export const BETTING_BET = "BETTING_BET";
export const BETTING_BET_REQUEST = "BETTING_BET_REQUEST";
export const BETTING_BET_CHAMPION = "BETTING_BET_CHAMPION";
export const BETTING_BET_CHAMPION_REQUEST = "BETTING_BET_CHAMPION_REQUEST";

export type ChampionshipBet = {
  manager: string;
  team: number;
  amount: number;
  odds: number;
};

export type Bet = {
  manager: string;
  coupon: string[];
  amount: number;
};

export type BettingState = {
  championshipBets: ChampionshipBet[];
  bets: Bet[];
};

const defaultState: BettingState = {
  championshipBets: [],
  bets: [],
};

export const betChampion = (manager: string, team: number, amount: number, odds: number) => {
  return {
    type: BETTING_BET_CHAMPION_REQUEST,
    payload: {
      manager,
      team,
      amount,
      odds,
    },
  };
};

export const bet = (manager: string, coupon: string[], amount: number) => {
  return {
    type: BETTING_BET_REQUEST,
    payload: {
      manager,
      coupon,
      amount,
    },
  };
};

export default function bettingReducer(
  state: BettingState = defaultState,
  action: any,
): BettingState {
  const { type, payload } = action;

  switch (type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case META_GAME_LOAD_STATE:
      return payload.betting;

    case SEASON_START:
      return produce(state, (draft) => {
        draft.championshipBets = [];
      });

    case BETTING_BET_CHAMPION:
      return produce(state, (draft) => {
        draft.championshipBets.push(payload);
      });

    case BETTING_BET:
      return produce(state, (draft) => {
        draft.bets.push(payload);
      });

    case GAME_NEXT_TURN:
      return produce(state, (draft) => {
        draft.bets = [];
      });

    default:
      return state;
  }
}
