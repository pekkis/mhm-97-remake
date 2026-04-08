import { connect } from "react-redux";
import Arena from "../Arena";
import { improveArena } from "../../ducks/manager";

export default connect(
  (state) => ({
    manager: state.manager.managers[state.manager.active],
    teams: state.game.teams
  }),
  { improveArena }
)(Arena);
