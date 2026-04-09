import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import Game from "../Game";
import { startGame, loadGame } from "../../ducks/meta";

export default connect(
  (state: RootState) => ({
    started: state.meta.started,
    turn: state.game.turn,
    menu: state.ui.menu
  }),
  { startGame, loadGame }
)(Game);
