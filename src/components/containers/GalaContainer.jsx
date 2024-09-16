import { connect } from "react-redux";
import Gala from "../Gala";
import { advance } from "../../ducks/game";
import { betChampion } from "../../ducks/betting";
import { interestingCompetitions } from "../../data/selectors";
export default connect(
  state => ({
    turn: state.game.get("turn"),
    manager: state.manager.getIn(["managers", state.manager.get("active")]),
    managers: state.manager.get("managers"),
    teams: state.game.get("teams"),
    competitions: state.game.get("competitions"),
    events: state.event.get("events"),
    news: state.news.get("news"),
    interestingCompetitions: interestingCompetitions(
      state.manager.get("active")
    )(state)
  }),
  { advance, betChampion }
)(Gala);
