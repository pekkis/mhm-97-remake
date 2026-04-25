import { createAction, createReducer } from "@reduxjs/toolkit";
import type { UiState } from "@/state/ui";
import { quitToMainMenu } from "./meta";

const defaultState: UiState = {
  menu: false
};

export const toggleMenu = createAction("UI_MENU_TOGGLE");
export const closeMenu = createAction("UI_MENU_CLOSE");

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(toggleMenu, (state) => {
      state.menu = !state.menu;
    })
    .addCase(closeMenu, (state) => {
      state.menu = false;
    });
});
