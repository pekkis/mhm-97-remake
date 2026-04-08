import { connect } from "react-redux";
import SelectStrategy from "../SelectStrategy";
import { selectStrategy } from "../../ducks/manager";

export default connect(
  (state) => ({
    manager: state.manager.managers[state.manager.active]
  }),
  { selectStrategy }
)(SelectStrategy);
