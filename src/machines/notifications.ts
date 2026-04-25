import { setup, assign, sendTo, type ActorRefFrom } from "xstate";
import {
  notificationMachine,
  type NotificationData
} from "@/machines/notification";

const MAX_NOTIFICATIONS = 3;

export type NotificationActorRef = ActorRefFrom<typeof notificationMachine>;

type NotificationsEvents =
  | { type: "PUSH"; notification: NotificationData }
  | { type: "DISMISS"; id: string }
  | { type: "REMOVE"; id: string };

/**
 * Parent machine for notifications. Each PUSH spawns a child
 * `notificationMachine` actor which auto-expires after 7s. Children
 * notify back via REMOVE on expiry; we cap at MAX_NOTIFICATIONS by
 * stopping the oldest when we'd overflow.
 */
export const notificationsMachine = setup({
  types: {
    context: {} as { notifications: NotificationActorRef[] },
    events: {} as NotificationsEvents
  },
  actors: {
    notification: notificationMachine
  }
}).createMachine({
  id: "notifications",
  context: { notifications: [] },
  on: {
    PUSH: {
      actions: assign({
        notifications: ({ context, event, spawn }) => {
          const ref = spawn("notification", {
            id: `notification-${event.notification.id}`,
            input: event.notification
          });
          const next = [...context.notifications, ref];
          if (next.length > MAX_NOTIFICATIONS) {
            const dropped = next.shift();
            dropped?.send({ type: "DISMISS" });
          }
          return next;
        }
      })
    },
    DISMISS: {
      actions: sendTo(
        ({ context, event }) =>
          context.notifications.find(
            (r) => r.getSnapshot().context.id === event.id
          )!,
        { type: "DISMISS" }
      )
    },
    REMOVE: {
      actions: assign({
        notifications: ({ context, event }) =>
          context.notifications.filter(
            (r) => r.getSnapshot().context.id !== event.id
          )
      })
    }
  }
});
