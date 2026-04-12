import * as styles from "./Notifications.css";
import Notification from "./Notification";
import { useSelector } from "@xstate/store-react";
import { notificationStore } from "@/stores/notification";

const Notifications = () => {
  const notifications = useSelector(
    notificationStore,
    (s) => s.context.notifications
  );

  return (
    <div className={styles.notifications}>
      {notifications.toReversed().map((n) => (
        <Notification
          key={n.id}
          dismiss={(id) =>
            notificationStore.send({ type: "dismissNotification", id })
          }
          notification={n}
        />
      ))}
    </div>
  );
};

export default Notifications;
