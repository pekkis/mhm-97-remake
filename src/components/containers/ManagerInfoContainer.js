import { connect } from "react-redux";
import ManagerInfo from "../ManagerInfo";
export default connect((state) => ({
  turn: state.game.turn,
  manager: state.manager.getIn(["managers", state.manager.get("active")]),
  managers: state.manager.get("managers"),
  teams: state.game.teams,
  competitions: state.game.competitions,
  events: state.event.events,
  news: state.news.get("news")
}))(ManagerInfo);
