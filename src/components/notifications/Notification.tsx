import type { FC } from "react";
import styled from "styled-components";
import type { Notification as NotificationType } from "../../ducks/notification";

type NotificationProps = {
  className?: string;
  notification: NotificationType;
  dismiss: (id: string) => void;
};

const Notification: FC<NotificationProps> = ({
  className,
  notification,
  dismiss,
}) => {
  return (
    <div onClick={() => dismiss(notification.id)} className={className}>
      {notification.message}
    </div>
  );
};

export default styled(Notification)`
  background-color: rgb(33, 33, 33);
  color: rgb(222, 222, 222);
  padding: 1em;
  cursor: pointer;
`;
