import { connect } from "react-redux";
import WorldChampionships from "../WorldChampionships";
export default connect((state) => ({
  results: state.game.worldChampionshipResults,
  turn: state.game.turn
}))(WorldChampionships);
