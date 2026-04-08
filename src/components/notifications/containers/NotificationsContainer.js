import { connect } from "react-redux";
import Notifications from "../Notifications";
import { dismissNotification } from "../../../ducks/notification";

export default connect(
  (state) => ({
    manager: state.manager.managers[state.manager.active],
    notifications: state.notification.notifications
  }),
  { dismissNotification }
)(Notifications);
