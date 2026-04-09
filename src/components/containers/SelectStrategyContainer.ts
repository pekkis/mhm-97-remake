import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import SelectStrategy from "../SelectStrategy";
import { selectStrategy } from "../../ducks/manager";

export default connect(
  (state: RootState) => ({
    manager: state.manager.managers[state.manager.active!]
  }),
  { selectStrategy }
)(SelectStrategy);
