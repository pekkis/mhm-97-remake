import { produce } from "immer";
import type { PrankInstance } from "../data/pranks";
import { META_QUIT_TO_MAIN_MENU, META_GAME_LOAD_STATE } from "./meta";

type PrankState = {
  pranks: PrankInstance[];
};

const defaultState: PrankState = {
  pranks: []
};

export const cancelPrank = (id: string) => ({
  type: "PRANK_CANCEL" as const,
  payload: id
});

export const selectPrankType = (id: string) => ({
  type: "PRANK_SELECT_TYPE" as const,
  payload: id
});

export const selectPrankVictim = (id: number) => ({
  type: "PRANK_SELECT_VICTIM" as const,
  payload: id
});

export const orderPrank = (manager: string, type: string, victim: number) => ({
  type: "PRANK_ORDER" as const,
  payload: { manager, type, victim }
});

type PrankAction =
  | { type: typeof META_QUIT_TO_MAIN_MENU }
  | { type: typeof META_GAME_LOAD_STATE; payload: { prank: PrankState } }
  | { type: "PRANK_ADD"; payload: PrankInstance }
  | { type: "PRANK_DISMISS"; payload: number };

export default function prankReducer(
  state: PrankState = defaultState,
  action: PrankAction
): PrankState {
  switch (action.type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case META_GAME_LOAD_STATE:
      return action.payload.prank;

    case "PRANK_ADD":
      return produce(state, (draft) => {
        draft.pranks.push(action.payload);
      });

    case "PRANK_DISMISS":
      return produce(state, (draft) => {
        draft.pranks.splice(action.payload, 1);
      });

    default:
      return state;
  }
}
