import { createAction, createReducer } from "@reduxjs/toolkit";
import type { NewsState } from "@/state/news";
import { nextTurn, syncFromMachine } from "./game";
import { quitToMainMenu, gameLoadState } from "./meta";

export const addAnnouncement = createAction<{
  manager: string;
  announcement: string;
}>("NEWS_ANNOUNCEMENT_ADD");
export const clearAnnouncements = createAction("NEWS_ANNOUNCEMENTS_CLEAR");
export const addNews = createAction<string>("NEWS_ADD");

const defaultState: NewsState = {
  news: [],
  announcements: {},
};

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(gameLoadState, (_state, action) => action.payload.news)
    .addCase(syncFromMachine, (_state, action) => action.payload.news)
    .addCase(addAnnouncement, (state, action) => {
      const { manager, announcement } = action.payload;
      if (!state.announcements[manager]) {
        state.announcements[manager] = [];
      }
      state.announcements[manager].push(announcement);
    })
    .addCase(clearAnnouncements, (state) => {
      state.announcements = {};
    })
    .addCase(addNews, (state, action) => {
      state.news.push(action.payload);
    })
    .addCase(nextTurn, (state) => {
      state.news = [];
    });
});
