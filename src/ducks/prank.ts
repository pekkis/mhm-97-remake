import { createAction, createReducer } from "@reduxjs/toolkit";
import type { PrankInstance } from "../data/pranks";
import { quitToMainMenu, gameLoadState } from "./meta";

type PrankState = {
  pranks: PrankInstance[];
};

const defaultState: PrankState = {
  pranks: []
};

export const cancelPrank = createAction<string>("PRANK_CANCEL");
export const selectPrankType = createAction<string>("PRANK_SELECT_TYPE");
export const selectPrankVictim = createAction<number>("PRANK_SELECT_VICTIM");
export const orderPrank = createAction<{
  manager: string;
  type: string;
  victim: number;
}>("PRANK_ORDER");
export const addPrank = createAction<PrankInstance>("PRANK_ADD");
export const dismissPrank = createAction<number>("PRANK_DISMISS");

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(gameLoadState, (_state, action) => action.payload.prank)
    .addCase(addPrank, (state, action) => {
      state.pranks.push(action.payload);
    })
    .addCase(dismissPrank, (state, action) => {
      state.pranks.splice(action.payload, 1);
    });
});
