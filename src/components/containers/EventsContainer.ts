import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import Events from "../Events";
import { advance } from "../../ducks/game";
import { resolveEvent } from "../../ducks/event";
export default connect(
  (state: RootState) => ({
    turn: state.game.turn,
    manager: state.manager.managers[state.manager.active!],
    managers: state.manager.managers,
    teams: state.game.teams,
    events: state.event.events,
    news: state.news.news,
    advanceEnabled: state.ui.advanceEnabled
  }),
  { advance, resolveEvent }
)(Events);
