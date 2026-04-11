import { createAction, createReducer } from "@reduxjs/toolkit";
import { quitToMainMenu } from "./meta";

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

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(addNotification, (state, action) => {
      state.notifications.push(action.payload);
      if (state.notifications.length > 3) {
        state.notifications = state.notifications.slice(-3);
      }
    })
    .addCase(dismissNotification, (state, action) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    });
});
