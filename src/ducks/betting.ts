import { createAction, createReducer } from "@reduxjs/toolkit";
import { quitToMainMenu, gameLoadState } from "./meta";
import { seasonStart, nextTurn } from "./game";

export const placeBet = createAction<{
  manager: string;
  coupon: string[];
  amount: number;
}>("BETTING_BET");

export const requestBet = createAction<{
  manager: string;
  coupon: string[];
  amount: number;
}>("BETTING_BET_REQUEST");

export const placeChampionBet = createAction<ChampionshipBet>(
  "BETTING_BET_CHAMPION"
);

export const requestChampionBet = createAction<{
  manager: string;
  team: number;
  amount: number;
  odds: number;
}>("BETTING_BET_CHAMPION_REQUEST");

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
  bets: []
};

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(gameLoadState, (_state, action) => action.payload.betting)
    .addCase(seasonStart, (state) => {
      state.championshipBets = [];
    })
    .addCase(placeChampionBet, (state, action) => {
      state.championshipBets.push(action.payload);
    })
    .addCase(placeBet, (state, action) => {
      state.bets.push(action.payload);
    })
    .addCase(nextTurn, (state) => {
      state.bets = [];
    });
});
