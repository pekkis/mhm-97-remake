import { Map, List } from "immutable";
import { v4 as uuid } from "uuid";

import {
  SEASON_START,
  GAME_DECREMENT_DURATIONS,
  GAME_CLEAR_EXPIRED
} from "./game";
import { loadGameState, quitToMainMenu } from "./meta";

const defaultState = Map({
  invitations: List()
});

export const INVITATION_ACCEPT_REQUEST = "INVITATION_ACCEPT_REQUEST";
export const INVITATION_ADD = "INVITATION_ADD_INVITATION";
export const INVITATION_ACCEPT = "INVITATION_ACCEPT";
export const INVITATION_CLEAR = "INVITATION_CLEAR";

export const acceptInvitation = (manager, id) => {
  return {
    type: INVITATION_ACCEPT_REQUEST,
    payload: {
      manager,
      id
    }
  };
};

export default function invitationReducer(state = defaultState, action) {
  const { type, payload } = action;

  switch (type) {
    case quitToMainMenu.type:
      return defaultState;

    case loadGameState.type:
      return payload.invitation;

    case INVITATION_ADD:
      return state.update("invitations", (invitations) =>
        invitations.push(Map(payload).set("id", uuid()))
      );

    case INVITATION_ACCEPT:
      console.log(action, "HAERIEWWFE");
      return state.update("invitations", (invitations) => {
        return invitations
          .update(
            invitations.findIndex(
              (i) =>
                i.get("manager") === payload.manager &&
                i.get("id") === payload.id
            ),
            (invitation) => {
              return invitation.set("participate", true);
            }
          )
          .filter((i) => {
            return i.get("manager") !== payload.manager || i.get("participate");
          });
      });
    case SEASON_START:
      return state.set("invitations", List());

    case GAME_DECREMENT_DURATIONS:
      return state.update("invitations", (invitations) => {
        return invitations.map((i) => {
          if (i.get("participate")) {
            return i;
          }
          return i.update("duration", (d) => d - 1);
        });
      });

    case GAME_CLEAR_EXPIRED:
      return state.update("invitations", (invitations) => {
        return invitations.filter(
          (i) => i.get("participate") || i.get("duration") > 0
        );
      });

    default:
      return state;
  }
}
