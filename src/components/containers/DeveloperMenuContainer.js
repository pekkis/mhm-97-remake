import { connect } from "react-redux";
import DeveloperMenu from "../DeveloperMenu";
import { advance } from "../../ducks/game";
import { resolveEvent } from "../../ducks/event";
import { saveGame, quitToMainMenu } from "../../ducks/meta";
export default connect(
  (state) => ({
    turn: state.game.turn,
    manager: state.manager.getIn(["managers", state.manager.get("active")]),
    managers: state.manager.get("managers"),
    teams: state.game.teams,
    competitions: state.game.competitions,
    events: state.event.events,
    news: state.news.get("news")
  }),
  { advance, resolveEvent, saveGame, quitToMainMenu }
)(DeveloperMenu);
