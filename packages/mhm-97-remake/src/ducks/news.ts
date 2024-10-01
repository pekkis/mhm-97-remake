import { Map, List } from "immutable";

import { GAME_NEXT_TURN } from "./game";
import { loadGameState, quitToMainMenu } from "./meta";

const defaultState = Map({
  news: List(),
  announcements: Map()
});

export const NEWS_ANNOUNCEMENT_ADD = "NEWS_ANNOUNCEMENT_ADD";
export const NEWS_ANNOUNCEMENTS_CLEAR = "NEWS_ANNOUNCEMENTS_CLEAR";
export const NEWS_ADD = "NEWS_ADD";

export default function newsReducer(state = defaultState, action) {
  const { type, payload } = action;

  switch (type) {
    case quitToMainMenu.type:
      return defaultState;

    case loadGameState.type:
      return state;

    case NEWS_ANNOUNCEMENT_ADD:
      return state.updateIn(
        ["announcements", payload.manager],
        List(),
        (announcements) => announcements.push(payload.announcement)
      );

    case NEWS_ANNOUNCEMENTS_CLEAR:
      return state.set("announcements", Map());

    case NEWS_ADD:
      return state.update("news", (news) => news.push(payload));

    case GAME_NEXT_TURN:
      return state.set("news", List());

    default:
      return state;
  }
}
