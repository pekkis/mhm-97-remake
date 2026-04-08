import { connect } from "react-redux";
import TransferMarket from "../TransferMarket";
import { buyPlayer, sellPlayer } from "../../ducks/manager";

export default connect(
  (state) => ({
    manager: state.manager.managers[state.manager.active],
    teams: state.game.teams
  }),
  { buyPlayer, sellPlayer }
)(TransferMarket);
