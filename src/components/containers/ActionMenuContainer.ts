import { connect } from "react-redux";
import type { RootState } from "@/config/redux";
import ActionMenu from "../ActionMenu";
import { advance } from "../../ducks/game";
import { resolveEvent } from "../../ducks/event";
import { closeMenu } from "../../ducks/ui";
import { saveGame, quitToMainMenu } from "../../ducks/meta";
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
  { advance, resolveEvent, saveGame, quitToMainMenu, closeMenu }
)(ActionMenu);
