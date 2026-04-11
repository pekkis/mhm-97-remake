import { produce } from "immer";
import { createAction } from "@reduxjs/toolkit";

export type Notification = {
  id: string;
  manager: string;
  message: string;
  type: string;
};

export type NotificationState = {
  notifications: Notification[];
};

const defaultState: NotificationState = {
  notifications: []
};

export const addNotification = createAction<Notification>("NOTIFICATION_ADD");
export const dismissNotification = createAction<string>("NOTIFICATION_DISMISS");

export default function notificationReducer(
  state: NotificationState = defaultState,
  action: any
): NotificationState {
  const { type, payload } = action;

  switch (type) {
    case "META_QUIT_TO_MAIN_MENU":
      return defaultState;

    case addNotification.type:
      return produce(state, (draft) => {
        draft.notifications.push(payload);
        if (draft.notifications.length > 3) {
          draft.notifications = draft.notifications.slice(-3);
        }
      });

    case dismissNotification.type:
      return produce(state, (draft) => {
        draft.notifications = draft.notifications.filter(
          (n) => n.id !== payload
        );
      });

    default:
      return state;
  }
}
