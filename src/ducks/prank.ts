import { createAction, createReducer } from "@reduxjs/toolkit";
import type { PrankInstance } from "@/game/pranks";
import { quitToMainMenu, gameLoadState } from "./meta";
import { syncFromMachine } from "./game";

type PrankState = {
  pranks: PrankInstance[];
};

const defaultState: PrankState = {
  pranks: []
};

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
    .addCase(syncFromMachine, (_state, action) => ({
      pranks: action.payload.pranks
    }))
    .addCase(addPrank, (state, action) => {
      state.pranks.push(action.payload);
    })
    .addCase(dismissPrank, (state, action) => {
      state.pranks.splice(action.payload, 1);
    });
});
