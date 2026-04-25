import { createAction, createReducer } from "@reduxjs/toolkit";
import type { BettingState, ChampionshipBet } from "@/state/betting";
import { quitToMainMenu } from "./meta";
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

const defaultState: BettingState = {
  championshipBets: [],
  bets: []
};

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
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
