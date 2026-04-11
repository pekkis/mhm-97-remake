import { createAction, createReducer } from "@reduxjs/toolkit";
import { quitToMainMenu } from "./meta";

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
};

const defaultState: UiState = {
  menu: false,
  advanceEnabled: true,
  tabs: {
    transferMarket: 0,
    prankVictim: 0,
    stats: 0,
    teamStats: 0
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

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(disableAdvance, (state) => {
      state.advanceEnabled = false;
    })
    .addCase(enableAdvance, (state) => {
      state.advanceEnabled = true;
    })
    .addCase(toggleMenu, (state) => {
      state.menu = !state.menu;
    })
    .addCase(closeMenu, (state) => {
      state.menu = false;
    })
    .addCase(selectTab, (state, action) => {
      state.tabs[action.payload.tab] = action.payload.value;
    });
});
