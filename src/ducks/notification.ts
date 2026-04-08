import { produce } from "immer";

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

export const dismissNotification = (id: string) => {
  return {
    type: "NOTIFICATION_DISMISS",
    payload: id
  };
};

export default function notificationReducer(
  state: NotificationState = defaultState,
  action: any
): NotificationState {
  const { type, payload } = action;

  switch (type) {
    case "META_QUIT_TO_MAIN_MENU":
      return defaultState;

    case "NOTIFICATION_ADD":
      return produce(state, (draft) => {
        draft.notifications.push(payload);
        if (draft.notifications.length > 3) {
          draft.notifications = draft.notifications.slice(-3);
        }
      });

    case "NOTIFICATION_DISMISS":
      return produce(state, (draft) => {
        draft.notifications = draft.notifications.filter(
          (n) => n.id !== payload
        );
      });

    default:
      return state;
  }
}
