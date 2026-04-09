import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import CrisisActions from "../CrisisActions";
import { crisisMeeting } from "../../ducks/manager";
export default connect(
  (state: RootState) => ({
    turn: state.game.turn,
    manager: state.manager.managers[state.manager.active!],
    managers: state.manager.managers,
    teams: state.game.teams,
    competitions: state.game.competitions,
    events: state.event.events,
    news: state.news.news
  }),
  { crisisMeeting }
)(CrisisActions);
