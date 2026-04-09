import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import Invitations from "../Invitations";
import { acceptInvitation } from "../../ducks/invitation";
export default connect(
  (state: RootState) => ({
    manager: state.manager.managers[state.manager.active!],
    invitations: state.invitation.invitations.filter(
      (i) => i.manager === state.manager.active
    )
  }),
  { acceptInvitation }
)(Invitations);
