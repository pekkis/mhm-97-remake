import * as styles from "./Notifications.css";
import Notification from "./Notification";
import { AppMachineContext } from "@/context/app-machine-context";
import { NotificationsContext } from "@/context/notifications-context";

const Notifications = () => {
  const appActor = AppMachineContext.useActorRef();
  const notifications = NotificationsContext.useSelector(
    (s) => s.context.notifications
  );

  return (
    <div className={styles.notifications}>
      {notifications.toReversed().map((ref) => (
        <Notification
          key={ref.id}
          actorRef={ref}
          dismiss={(id) => appActor.send({ type: "DISMISS_NOTIFICATION", id })}
        />
      ))}
    </div>
  );
};

export default Notifications;
