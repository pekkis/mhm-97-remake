import { connect } from "react-redux";
import News from "../News";
export default connect((state) => ({
  turn: state.game.turn,
  manager: state.manager.getIn(["managers", state.manager.get("active")]),
  managers: state.manager.get("managers"),
  teams: state.game.teams,
  events: state.event.events,
  news: state.news.get("news"),
  advanceEnabled: state.ui.advanceEnabled,
  announcements: state.news.get("announcements")
}))(News);
