import { connect } from "react-redux";
import Game from "../Game";
import { startGame, loadGame } from "../../ducks/meta";

export default connect(
  (state) => ({
    started: state.meta.get("started"),
    turn: state.game.get("turn"),
    menu: state.ui.get("menu")
  }),
  { startGame, loadGame }
)(Game);
