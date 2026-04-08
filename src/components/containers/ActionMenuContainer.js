import { connect } from "react-redux";
import ActionMenu from "../ActionMenu";
import { advance } from "../../ducks/game";
import { resolveEvent } from "../../ducks/event";
import { closeMenu } from "../../ducks/ui";
import { saveGame, quitToMainMenu } from "../../ducks/meta";
export default connect(
  (state) => ({
    turn: state.game.turn,
    manager: state.manager.getIn(["managers", state.manager.get("active")]),
    managers: state.manager.get("managers"),
    teams: state.game.teams,
    competitions: state.game.competitions,
    events: state.event.events,
    news: state.news.news
  }),
  { advance, resolveEvent, saveGame, quitToMainMenu, closeMenu }
)(ActionMenu);
