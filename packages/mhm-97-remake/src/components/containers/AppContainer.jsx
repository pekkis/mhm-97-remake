import { connect } from "react-redux";
import App from "../App";
import { startGame, loadGame } from "../../ducks/meta";

export default connect(
  (state) => ({
    started: state.meta.get("started")
  }),
  { startGame, loadGame }
)(App);
