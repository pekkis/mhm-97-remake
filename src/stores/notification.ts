// The notifications system now lives inside `appMachine` as an invoked
// child actor — see `src/machines/notifications.ts`. Components reach it
// via the system id `"notifications"` from `AppMachineContext`.

export type { NotificationData as Notification } from "@/machines/notification";
