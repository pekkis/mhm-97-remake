import { connect } from "react-redux";
import ChampionshipBetting from "../ChampionshipBetting";
import { advance } from "../../ducks/game";
import { betChampion } from "../../ducks/betting";
import { interestingCompetitions } from "../../data/selectors";
export default connect(
  (state) => ({
    turn: state.game.turn,
    manager: state.manager.getIn(["managers", state.manager.get("active")]),
    managers: state.manager.get("managers"),
    teams: state.game.teams,
    competitions: state.game.competitions,
    events: state.event.events,
    news: state.news.get("news"),
    interestingCompetitions: interestingCompetitions(
      state.manager.get("active")
    )(state)
  }),
  { advance, betChampion }
)(ChampionshipBetting);
