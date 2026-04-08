import { connect } from "react-redux";
import Current from "../Current";
import { advance } from "../../../ducks/game";
import { resolveEvent } from "../../../ducks/event";
import { closeMenu } from "../../../ducks/ui";
import { saveGame, quitToMainMenu } from "../../../ducks/meta";
export default connect(
  (state) => ({
    turn: state.game.turn,
    manager: state.manager.managers[state.manager.active],
    managers: state.manager.managers,
    teams: state.game.teams,
    competitions: state.game.competitions,
    events: state.event.events,
    news: state.news.news,
    invitations: state.invitation.invitations.filter(
      (i) => i.manager === state.manager.active
    )
  }),
  { advance, resolveEvent, saveGame, quitToMainMenu, closeMenu }
)(Current);
