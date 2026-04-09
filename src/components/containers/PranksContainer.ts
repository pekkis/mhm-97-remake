import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import Pranks from "../Pranks";
import {
  orderPrank,
  selectPrankType,
  selectPrankVictim,
  cancelPrank
} from "../../ducks/prank";
export default connect(
  (state: RootState) => ({
    turn: state.game.turn,
    manager: state.manager.managers[state.manager.active!],
    managers: state.manager.managers,
    teams: state.game.teams,
    events: state.event.events,
    news: state.news.news,
    advanceEnabled: state.ui.advanceEnabled,
    prank: state.ui.prank,
    competitions: state.game.competitions
  }),
  { orderPrank, selectPrankType, selectPrankVictim, cancelPrank }
)(Pranks);
