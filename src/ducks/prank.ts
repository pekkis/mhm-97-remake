import { createAction, createReducer } from "@reduxjs/toolkit";
import type { PrankState } from "@/state/prank";
import type { PrankInstance } from "@/game/pranks";
import { quitToMainMenu } from "./meta";

const defaultState: PrankState = {
  pranks: []
};

export const addPrank = createAction<PrankInstance>("PRANK_ADD");
export const dismissPrank = createAction<number>("PRANK_DISMISS");

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(addPrank, (state, action) => {
      state.pranks.push(action.payload);
    })
    .addCase(dismissPrank, (state, action) => {
      state.pranks.splice(action.payload, 1);
    });
});
