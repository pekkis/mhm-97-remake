import { createActor } from "xstate";
import { notificationsMachine } from "@/machines/notifications";
import type { NotificationData } from "@/machines/notification";

export type Notification = NotificationData;

/**
 * Singleton notifications actor. Each notification is its own
 * `notificationMachine` child with a 7-second `after` transition to
 * `expired` — see `src/machines/notification.ts`.
 */
export const notificationsActor = createActor(notificationsMachine);
notificationsActor.start();

export const pushNotification = (notification: NotificationData) => {
  notificationsActor.send({ type: "PUSH", notification });
};

export const dismissNotification = (id: string) => {
  notificationsActor.send({ type: "DISMISS", id });
};
