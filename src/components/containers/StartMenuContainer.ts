import { connect } from "react-redux";
import { pick } from "remeda";
import StartMenu from "../StartMenu";
import { startGame, loadGame } from "../../ducks/meta";
import { advance } from "../../ducks/game";
import type { RootState } from "@/config/redux";

export default connect(
  (state: RootState) => ({
    started: state.meta.started,
    starting: state.meta.starting,
    manager: state.meta.manager,
    teams: state.game.teams,
    competitions: pick(state.game.competitions, ["phl", "division"])
  }),
  { startGame, loadGame, advance }
)(StartMenu);
