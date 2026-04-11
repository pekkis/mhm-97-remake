import { produce } from "immer";
import { createAction } from "@reduxjs/toolkit";
import type { PrankInstance } from "../data/pranks";
import { META_QUIT_TO_MAIN_MENU, META_GAME_LOAD_STATE } from "./meta";

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

export default function prankReducer(
  state: PrankState = defaultState,
  action: any
): PrankState {
  switch (action.type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case META_GAME_LOAD_STATE:
      return action.payload.prank;

    case addPrank.type:
      return produce(state, (draft) => {
        draft.pranks.push(action.payload);
      });

    case dismissPrank.type:
      return produce(state, (draft) => {
        draft.pranks.splice(action.payload, 1);
      });

    default:
      return state;
  }
}
