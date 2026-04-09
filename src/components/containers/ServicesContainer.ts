import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import Services from "../Services";
import { toggleService } from "../../ducks/manager";

export default connect(
  (state: RootState) => ({
    manager: state.manager.managers[state.manager.active!],
    teams: state.game.teams,
    basePrices: state.game.serviceBasePrices
  }),
  { toggleService }
)(Services);
