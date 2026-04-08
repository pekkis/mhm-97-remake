import { connect } from "react-redux";
import CrisisActions from "../CrisisActions";
import { crisisMeeting } from "../../ducks/manager";
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
  { crisisMeeting }
)(CrisisActions);
