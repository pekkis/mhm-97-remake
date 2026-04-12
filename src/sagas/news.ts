import { put } from "typed-redux-saga";

import {
  addAnnouncement as addAnnouncementAction,
  addNews as addNewsAction
} from "@/ducks/news";

export function* addAnnouncement(manager: string, announcement: string) {
  yield* put(
    addAnnouncementAction({
      manager: manager.toString(),
      announcement
    })
  );
}

export function* addNews(news: string) {
  yield* put(addNewsAction(news));
}
