import { connect } from "react-redux";
import Streaks from "../Streaks";
export default connect((state) => ({
  teams: state.game.teams,
  competitions: state.game.competitions,
  streaks: state.stats.getIn(["streaks", "team"])
}))(Streaks);
