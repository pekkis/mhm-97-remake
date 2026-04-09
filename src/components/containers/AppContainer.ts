import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import App from "../App";
import { startGame, loadGame } from "../../ducks/meta";

export default connect(
  (state: RootState) => ({
    started: state.meta.started
  }),
  { startGame, loadGame }
)(App);
