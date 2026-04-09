import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import Header from "../Header";
import { advance } from "../../ducks/game";
import { toggleMenu } from "../../ducks/ui";

export default connect(
  (state: RootState) => ({
    manager: state.manager.managers[state.manager.active!],
    advanceEnabled: state.ui.advanceEnabled
  }),
  { advance, toggleMenu }
)(Header);
