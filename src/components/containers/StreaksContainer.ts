import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import Streaks from "../Streaks";
export default connect((state: RootState) => ({
  teams: state.game.teams,
  competitions: state.game.competitions,
  streaks: state.stats.streaks.team
}))(Streaks);
