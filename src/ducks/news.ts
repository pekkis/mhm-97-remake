import { produce } from "immer";
import { createAction } from "@reduxjs/toolkit";
import { GAME_NEXT_TURN } from "./game";

export const NEWS_ANNOUNCEMENT_ADD = "NEWS_ANNOUNCEMENT_ADD";
export const NEWS_ANNOUNCEMENTS_CLEAR = "NEWS_ANNOUNCEMENTS_CLEAR";
export const NEWS_ADD = "NEWS_ADD";

export const addAnnouncement = createAction<{
  manager: string;
  announcement: string;
}>(NEWS_ANNOUNCEMENT_ADD);
export const clearAnnouncements = createAction(NEWS_ANNOUNCEMENTS_CLEAR);
export const addNews = createAction<string>(NEWS_ADD);

export type NewsState = {
  news: string[];
  announcements: Record<string, string[]>;
};

const defaultState: NewsState = {
  news: [],
  announcements: {}
};

export default function newsReducer(
  state: NewsState = defaultState,
  action: any
): NewsState {
  const { type, payload } = action;

  switch (type) {
    case "META_QUIT_TO_MAIN_MENU":
      return defaultState;

    case "META_GAME_LOAD_STATE":
      return payload.news;

    case NEWS_ANNOUNCEMENT_ADD:
      return produce(state, (draft) => {
        const mgr = payload.manager;
        if (!draft.announcements[mgr]) {
          draft.announcements[mgr] = [];
        }
        draft.announcements[mgr].push(payload.announcement);
      });

    case NEWS_ANNOUNCEMENTS_CLEAR:
      return produce(state, (draft) => {
        draft.announcements = {};
      });

    case NEWS_ADD:
      return produce(state, (draft) => {
        draft.news.push(payload);
      });

    case GAME_NEXT_TURN:
      return produce(state, (draft) => {
        draft.news = [];
      });

    default:
      return state;
  }
}
