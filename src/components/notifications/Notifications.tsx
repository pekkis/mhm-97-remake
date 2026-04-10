import styled from "styled-components";
import Notification from "./Notification";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { dismissNotification } from "../../ducks/notification";

type NotificationsProps = {
  className?: string;
};

const Notifications = ({ className }: NotificationsProps) => {
  const notifications = useAppSelector(
    (state) => state.notification.notifications,
  );
  const dispatch = useAppDispatch();

  return (
    <div className={className}>
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

export default styled(Notifications)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
`;
