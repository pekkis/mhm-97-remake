import { connect } from "react-redux";
import Stats from "../Stats";
import type { RootState } from "../../config/redux";

const mapStateToProps = (state: RootState) => ({
  manager: state.manager.getIn(["managers", state.manager.get("active")]),
  teams: state.game.get("teams"),
  competitions: state.game.get("competitions"),
  stats: state.stats,
  countries: state.country.countries
});

export default connect(mapStateToProps)(Stats);
