import { createAction, createReducer } from "@reduxjs/toolkit";
import type { MetaState } from "@/state/meta";

export const quitToMainMenu = createAction("META_QUIT_TO_MAIN_MENU");
export const startGame = createAction("META_GAME_START_REQUEST");
export const saveGame = createAction("META_GAME_SAVE_REQUEST");
export const loadGame = createAction("META_GAME_LOAD_REQUEST");
export const gameLoadState = createAction<any>("META_GAME_LOAD_STATE");
export const gameLoaded = createAction("META_GAME_LOADED");
export const gameStart = createAction("GAME_START");

const defaultState: MetaState = {
  started: false,
  loading: false,
  saving: false,
  starting: false,
  manager: {
    name: "Gaylord Lohiposki",
    arena: "MasoSports Areena",
    difficulty: "2",
    team: 12
  }
};

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(startGame, (state) => {
      state.starting = true;
    })
    .addMatcher(
      (action: { type: string }) =>
        action.type === "SEASON_START" || gameLoaded.match(action),
      (state) => {
        state.started = true;
        state.loading = false;
      }
    );
});
