import { setup, sendParent } from "xstate";

export type NotificationData = {
  id: string;
  manager: string;
  message: string;
  type: string;
};

const AUTO_DISMISS_MS = 7000;

/**
 * One notification = one machine. Lives 7 seconds in `active`, then
 * transitions to `expired` and notifies the parent so it can reap.
 * Manual `DISMISS` short-circuits the timer.
 */
export const notificationMachine = setup({
  types: {
    context: {} as NotificationData,
    input: {} as NotificationData,
    events: {} as { type: "DISMISS" }
  }
}).createMachine({
  id: "notification",
  context: ({ input }) => input,
  initial: "active",
  states: {
    active: {
      after: { [AUTO_DISMISS_MS]: "expired" },
      on: { DISMISS: "expired" }
    },
    expired: {
      type: "final",
      entry: sendParent(({ context }) => ({
        type: "REMOVE",
        id: context.id
      }))
    }
  }
});
