import React from "react";
import styled from "styled-components";
import Notification from "./Notification";

const Notifications = (props) => {
  const { className, notifications, dismissNotification } = props;

  return (
    <div className={className}>
      {notifications.toReversed().map((n) => (
        <Notification
          key={n.id}
          dismiss={dismissNotification}
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
