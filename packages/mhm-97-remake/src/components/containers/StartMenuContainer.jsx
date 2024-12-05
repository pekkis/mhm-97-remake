import { connect } from "react-redux";
import StartMenu from "../StartMenu";
import { startGame, loadGame } from "../../ducks/meta";
import { advance } from "../../ducks/game";

export default connect(
  (state) => ({
    started: state.meta.started,
    starting: state.meta.starting,
    manager: state.meta.manager,
    teams: state.game.get("teams"),
    competitions: state.game
      .get("competitions")
      .filter((c, k) => ["phl", "division"].includes(k))
  }),
  { startGame, loadGame, advance }
)(StartMenu);
