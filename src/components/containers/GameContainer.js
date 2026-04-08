import { connect } from "react-redux";
import Game from "../Game";
import { startGame, loadGame } from "../../ducks/meta";

export default connect(
  (state) => ({
    started: state.meta.started,
    turn: state.game.turn,
    menu: state.ui.menu
  }),
  { startGame, loadGame }
)(Game);
