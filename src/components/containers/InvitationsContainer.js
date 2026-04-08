import { connect } from "react-redux";
import Invitations from "../Invitations";
import { acceptInvitation } from "../../ducks/invitation";
export default connect(
  (state) => ({
    manager: state.manager.managers[state.manager.active],
    invitations: state.invitation.invitations.filter(
      (i) => i.manager === state.manager.active
    )
  }),
  { acceptInvitation }
)(Invitations);
