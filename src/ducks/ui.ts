import { produce } from "immer";
import { META_QUIT_TO_MAIN_MENU } from "./meta";

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

export const selectTab = (tab: keyof Tabs, value: number) => ({
  type: "UI_SELECT_TAB" as const,
  payload: { tab, value }
});

export const toggleMenu = () => ({
  type: "UI_MENU_TOGGLE" as const
});

export const closeMenu = () => ({
  type: "UI_MENU_CLOSE" as const
});

type UiAction =
  | { type: typeof META_QUIT_TO_MAIN_MENU }
  | { type: "UI_DISABLE_ADVANCE" }
  | { type: "UI_ENABLE_ADVANCE" }
  | { type: "UI_MENU_TOGGLE" }
  | { type: "UI_MENU_CLOSE" }
  | { type: "UI_SELECT_TAB"; payload: { tab: keyof Tabs; value: number } }
  | { type: "PRANK_CANCEL" }
  | { type: "PRANK_ORDER" }
  | { type: "PRANK_SELECT_TYPE"; payload: string }
  | { type: "PRANK_SELECT_VICTIM"; payload: number };

export default function uiReducer(
  state: UiState = defaultState,
  action: UiAction
): UiState {
  switch (action.type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case "UI_DISABLE_ADVANCE":
      return produce(state, (draft) => {
        draft.advanceEnabled = false;
      });

    case "UI_ENABLE_ADVANCE":
      return produce(state, (draft) => {
        draft.advanceEnabled = true;
      });

    case "UI_MENU_TOGGLE":
      return produce(state, (draft) => {
        draft.menu = !draft.menu;
      });

    case "UI_MENU_CLOSE":
      return produce(state, (draft) => {
        draft.menu = false;
      });

    case "UI_SELECT_TAB":
      return produce(state, (draft) => {
        draft.tabs[action.payload.tab] = action.payload.value;
      });

    case "PRANK_CANCEL":
    case "PRANK_ORDER":
      return produce(state, (draft) => {
        draft.prank = { type: undefined, victim: undefined };
      });

    case "PRANK_SELECT_TYPE":
      return produce(state, (draft) => {
        draft.prank.type = action.payload;
      });

    case "PRANK_SELECT_VICTIM":
      return produce(state, (draft) => {
        draft.prank.victim = action.payload;
      });

    default:
      return state;
  }
}
