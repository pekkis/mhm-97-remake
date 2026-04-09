import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import Arena from "../Arena";
import { improveArena } from "../../ducks/manager";

export default connect(
  (state: RootState) => ({
    manager: state.manager.managers[state.manager.active!],
    teams: state.game.teams
  }),
  { improveArena }
)(Arena);
