import { connect } from "react-redux";
import Stats from "../Stats";
import type { RootState } from "../../config/redux";

const mapStateToProps = (state: RootState) => ({
  manager: state.manager.managers[state.manager.active!],
  teams: state.game.teams,
  competitions: state.game.competitions,
  stats: state.stats,
  countries: state.country.countries
});

export default connect(mapStateToProps)(Stats);
