import { createStore } from "@xstate/store";

export type Notification = {
  id: string;
  manager: string;
  message: string;
  type: string;
};

export type NotificationStoreContext = {
  notifications: Notification[];
};

const MAX_NOTIFICATIONS = 3;

export const notificationStore = createStore({
  context: {
    notifications: [] as Notification[]
  },
  on: {
    addNotification: (
      context,
      event: { notification: Notification }
    ) => ({
      ...context,
      notifications: [...context.notifications, event.notification].slice(
        -MAX_NOTIFICATIONS
      )
    }),
    dismissNotification: (context, event: { id: string }) => ({
      ...context,
      notifications: context.notifications.filter((n) => n.id !== event.id)
    }),
    reset: () => ({
      notifications: [] as Notification[]
    })
  }
});
