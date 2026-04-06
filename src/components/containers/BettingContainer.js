import { connect } from "react-redux";
import Betting from "../Betting";
import { bet } from "../../ducks/betting";

export default connect(
  (state) => ({
    turn: state.game.turn,
    manager: state.manager.getIn(["managers", state.manager.get("active")]),
    teams: state.game.teams,
    competition: state.game.competitions.phl
  }),
  { bet }
)(Betting);
