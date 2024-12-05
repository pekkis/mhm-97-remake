import { createAction, createReducer } from "@reduxjs/toolkit";

const defaultState = {
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

export const loadGameState = createAction("META_GAME_LOAD_STATE");

export const quitToMainMenu = createAction("META_QUIT_TO_MAIN_MENU");

export const startGame = createAction("META_GAME_START_REQUEST");

export const saveGame = createAction("META_GAME_SAVE_REQUEST");

export const loadGame = createAction("META_GAME_LOAD_REQUEST");

export const gameLoaded = createAction("META_GAME_LOADED");

export default createReducer(defaultState, (builder) => {
  builder.addCase(quitToMainMenu, () => {
    return defaultState;
  });

  builder.addCase(startGame, (state) => {
    state.starting = true;
  });

  builder.addCase(saveGame, (state) => {
    state.saving = true;
  });

  builder.addCase(loadGame, (state) => {
    state.loading = true;
  });

  builder.addCase("SEASON_START", (state) => {
    state.loading = false;
    state.started = true;
  });

  builder.addCase(gameLoaded, (state) => {
    state.loading = false;
    state.started = true;
  });
});
