import * as styles from "./Notifications.css";
import Notification from "./Notification";
import { useSelector } from "@xstate/react";
import { notificationsActor, dismissNotification } from "@/stores/notification";

const Notifications = () => {
  const notifications = useSelector(
    notificationsActor,
    (s) => s.context.notifications
  );

  return (
    <div className={styles.notifications}>
      {notifications.toReversed().map((ref) => (
        <Notification
          key={ref.id}
          actorRef={ref}
          dismiss={dismissNotification}
        />
      ))}
    </div>
  );
};

export default Notifications;
