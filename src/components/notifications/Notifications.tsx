import * as styles from "./Notifications.css";
import Notification from "./Notification";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { dismissNotification } from "../../ducks/notification";

const Notifications = () => {
  const notifications = useAppSelector(
    (state) => state.notification.notifications
  );
  const dispatch = useAppDispatch();

  return (
    <div className={styles.notifications}>
      {notifications.toReversed().map((n) => (
        <Notification
          key={n.id}
          dismiss={(id) => dispatch(dismissNotification(id))}
          notification={n}
        />
      ))}
    </div>
  );
};

export default Notifications;
