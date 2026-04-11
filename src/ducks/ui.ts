import { produce } from "immer";
import { createAction } from "@reduxjs/toolkit";
import { META_QUIT_TO_MAIN_MENU } from "./meta";
import {
  cancelPrank,
  orderPrank,
  selectPrankType,
  selectPrankVictim
} from "./prank";

type PrankSelection = {
  type: string | undefined;
  victim: number | undefined;
};

type Tabs = {
  transferMarket: number;
  prankVictim: number;
  stats: number;
  teamStats: number;
};

export type UiState = {
  menu: boolean;
  advanceEnabled: boolean;
  tabs: Tabs;
  prank: PrankSelection;
};

const defaultState: UiState = {
  menu: false,
  advanceEnabled: true,
  tabs: {
    transferMarket: 0,
    prankVictim: 0,
    stats: 0,
    teamStats: 0
  },
  prank: {
    type: undefined,
    victim: undefined
  }
};

export const disableAdvance = createAction("UI_DISABLE_ADVANCE");
export const enableAdvance = createAction("UI_ENABLE_ADVANCE");
export const selectTab = createAction<{
  tab: keyof Tabs;
  value: number;
}>("UI_SELECT_TAB");
export const toggleMenu = createAction("UI_MENU_TOGGLE");
export const closeMenu = createAction("UI_MENU_CLOSE");

export default function uiReducer(
  state: UiState = defaultState,
  action: any
): UiState {
  switch (action.type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case disableAdvance.type:
      return produce(state, (draft) => {
        draft.advanceEnabled = false;
      });

    case enableAdvance.type:
      return produce(state, (draft) => {
        draft.advanceEnabled = true;
      });

    case toggleMenu.type:
      return produce(state, (draft) => {
        draft.menu = !draft.menu;
      });

    case closeMenu.type:
      return produce(state, (draft) => {
        draft.menu = false;
      });

    case selectTab.type:
      return produce(state, (draft) => {
        draft.tabs[action.payload.tab] = action.payload.value;
      });

    case cancelPrank.type:
    case orderPrank.type:
      return produce(state, (draft) => {
        draft.prank = { type: undefined, victim: undefined };
      });

    case selectPrankType.type:
      return produce(state, (draft) => {
        draft.prank.type = action.payload;
      });

    case selectPrankVictim.type:
      return produce(state, (draft) => {
        draft.prank.victim = action.payload;
      });

    default:
      return state;
  }
}
