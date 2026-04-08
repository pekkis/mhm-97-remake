import { connect } from "react-redux";
import Gala from "../Gala";
import { advance } from "../../ducks/game";
import { betChampion } from "../../ducks/betting";
import { interestingCompetitions } from "../../data/selectors";
export default connect(
  (state) => ({
    turn: state.game.turn,
    manager: state.manager.managers[state.manager.active],
    managers: state.manager.managers,
    teams: state.game.teams,
    competitions: state.game.competitions,
    events: state.event.events,
    news: state.news.news,
    interestingCompetitions: interestingCompetitions(
      state.manager.active
    )(state)
  }),
  { advance, betChampion }
)(Gala);
