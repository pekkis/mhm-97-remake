// The notifications system now lives inside `gameMachine` as an invoked
// child actor — see `src/machines/notifications.ts`. Components reach it
// via the system id `"notifications"` from `GameMachineContext`.

export type { NotificationData as Notification } from "@/machines/notification";
