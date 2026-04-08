import { connect } from "react-redux";
import EndOfSeason from "../EndOfSeason";
import { advance } from "../../ducks/game";
import { resolveEvent } from "../../ducks/event";
import { saveGame, quitToMainMenu } from "../../ducks/meta";
import { interestingCompetitions } from "../../data/selectors";
export default connect(
  (state) => ({
    turn: state.game.turn,
    manager: state.manager.getIn(["managers", state.manager.get("active")]),
    managers: state.manager.get("managers"),
    teams: state.game.teams,
    competitions: state.game.competitions,
    events: state.event.events,
    news: state.news.news,
    interestingCompetitions: interestingCompetitions(
      state.manager.get("active")
    )(state),
    announcements: state.news.announcements
  }),
  { advance, resolveEvent, saveGame, quitToMainMenu }
)(EndOfSeason);
