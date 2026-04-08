import { connect } from "react-redux";
import GamedayResults from "../GamedayResults";
import { advance } from "../../ducks/game";
import { resolveEvent } from "../../ducks/event";
import { saveGame, quitToMainMenu } from "../../ducks/meta";
export default connect(
  (state) => ({
    turn: state.game.turn,
    manager: state.manager.managers[state.manager.active],
    managers: state.manager.managers,
    teams: state.game.teams,
    competitions: state.game.competitions,
    events: state.event.events,
    news: state.news.news
  }),
  { advance, resolveEvent, saveGame, quitToMainMenu }
)(GamedayResults);
