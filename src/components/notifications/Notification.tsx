import type { FC } from "react";
import * as styles from "./Notification.css";
import type { Notification as NotificationType } from "@/stores/notification";

type NotificationProps = {
  notification: NotificationType;
  dismiss: (id: string) => void;
};

const Notification: FC<NotificationProps> = ({ notification, dismiss }) => {
  return (
    <div
      onClick={() => dismiss(notification.id)}
      className={styles.notification}
    >
      {notification.message}
    </div>
  );
};

export default Notification;
