import { connect } from "react-redux";
import Pranks from "../Pranks";
import {
  orderPrank,
  selectPrankType,
  selectPrankVictim,
  cancelPrank
} from "../../ducks/prank";
export default connect(
  (state) => ({
    turn: state.game.turn,
    manager: state.manager.getIn(["managers", state.manager.get("active")]),
    managers: state.manager.get("managers"),
    teams: state.game.teams,
    events: state.event.events,
    news: state.news.news,
    advanceEnabled: state.ui.advanceEnabled,
    prank: state.ui.prank,
    competitions: state.game.competitions
  }),
  { orderPrank, selectPrankType, selectPrankVictim, cancelPrank }
)(Pranks);
