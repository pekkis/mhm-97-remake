import * as styles from "./Notifications.css";
import Notification from "./Notification";
import { useSelector } from "@xstate/react";
import { AppMachineContext } from "@/context/app-machine-context";
import type { ActorRefFrom } from "xstate";
import type { notificationsMachine } from "@/machines/notifications";

const Notifications = () => {
  const appActor = AppMachineContext.useActorRef();
  const notificationsActor = appActor.system.get(
    "notifications"
  ) as ActorRefFrom<typeof notificationsMachine>;

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
          dismiss={(id) => appActor.send({ type: "DISMISS_NOTIFICATION", id })}
        />
      ))}
    </div>
  );
};

export default Notifications;
