import { connect } from "react-redux";
import News from "../News";
export default connect((state) => ({
  turn: state.game.turn,
  manager: state.manager.managers[state.manager.active],
  managers: state.manager.managers,
  teams: state.game.teams,
  events: state.event.events,
  news: state.news.news,
  advanceEnabled: state.ui.advanceEnabled,
  announcements: state.news.announcements
}))(News);
