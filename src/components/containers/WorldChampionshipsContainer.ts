import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import WorldChampionships from "../WorldChampionships";
export default connect((state: RootState) => ({
  results: state.game.worldChampionshipResults,
  turn: state.game.turn
}))(WorldChampionships);
