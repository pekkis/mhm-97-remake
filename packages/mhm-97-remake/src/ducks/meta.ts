import { Map } from "immutable";

// import { SEASON_START } from "./game";
import { createAction, createReducer } from "@reduxjs/toolkit";

const defaultState = Map({
  started: false,
  loading: false,
  saving: false,
  starting: false,
  manager: Map({
    name: "Gaylord Lohiposki",
    arena: "MasoSports Areena",
    difficulty: "2",
    team: 12
  })
});

export const loadGameState = createAction("META_GAME_LOAD_STATE");

export const quitToMainMenu = createAction("META_QUIT_TO_MAIN_MENU");

export const startGame = createAction("META_GAME_START_REQUEST");

export const saveGame = createAction("META_GAME_SAVE_REQUEST");

export const loadGame = createAction("META_GAME_LOAD_REQUEST");

export const gameLoaded = createAction("META_GAME_LOADED");

export default createReducer(defaultState, (builder) => {
  builder.addCase(quitToMainMenu, (state, action) => {
    return defaultState;
  });

  builder.addCase(startGame, (state, action) => {
    return state.set("starting", true);
  });

  builder.addCase(saveGame, (state, action) => {
    return state.set("saving", true);
  });

  builder.addCase(loadGame, (state, action) => {
    return state.set("loading", true);
  });

  builder.addCase("SEASON_START", (state, action) => {
    return state.set("started", true).set("loading", false);
  });

  builder.addCase(gameLoaded, (state, action) => {
    return state.set("started", true).set("loading", false);
  });
});
