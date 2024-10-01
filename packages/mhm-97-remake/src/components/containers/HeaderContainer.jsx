import { connect } from "react-redux";
import Header from "../Header";
import { advance } from "../../ducks/game";
import { toggleMenu } from "../../ducks/ui";

export default connect(
  (state) => ({
    manager: state.manager.getIn(["managers", state.manager.get("active")]),
    advanceEnabled: state.ui.get("advanceEnabled")
  }),
  { advance, toggleMenu }
)(Header);
