import { produce } from "immer";

import { SEASON_START } from "./game";

export const META_QUIT_TO_MAIN_MENU = "META_QUIT_TO_MAIN_MENU";
export const META_GAME_LOAD_STATE = "META_GAME_LOAD_STATE";

export type MetaManager = {
  name: string;
  arena: string;
  difficulty: string;
  team: number;
};

export type MetaState = {
  started: boolean;
  loading: boolean;
  saving: boolean;
  starting: boolean;
  manager: MetaManager;
};

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

export interface MetaQuitToMainMenuAction {
  type: typeof META_QUIT_TO_MAIN_MENU;
}

export const quitToMainMenu = (): MetaQuitToMainMenuAction => ({
  type: META_QUIT_TO_MAIN_MENU
});

export const startGame = () => {
  return {
    type: "META_GAME_START_REQUEST"
  };
};

export const saveGame = () => {
  return {
    type: "META_GAME_SAVE_REQUEST"
  };
};

export const loadGame = () => {
  return {
    type: "META_GAME_LOAD_REQUEST"
  };
};

export default function metaReducer(
  state: MetaState = defaultState,
  action: any
): MetaState {
  const { type } = action;

  switch (type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case "SEASON_START_REQUEST":
      return produce(state, (draft) => {
        draft.loading = true;
      });

    case SEASON_START:
    case "META_GAME_LOADED":
      return produce(state, (draft) => {
        draft.started = true;
        draft.loading = false;
      });

    case "META_GAME_START_REQUEST":
      return produce(state, (draft) => {
        draft.starting = true;
      });

    default:
      return state;
  }
}
