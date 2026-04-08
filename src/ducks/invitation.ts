import { produce } from "immer";
import {
  SEASON_START,
  GAME_DECREMENT_DURATIONS,
  GAME_CLEAR_EXPIRED
} from "./game";

export type Invitation = {
  id: string;
  manager: string;
  tournament: number;
  duration: number;
  participate?: boolean;
};

export type InvitationState = {
  invitations: Invitation[];
};

const defaultState: InvitationState = {
  invitations: []
};

export const INVITATION_ACCEPT_REQUEST = "INVITATION_ACCEPT_REQUEST";
export const INVITATION_ADD = "INVITATION_ADD_INVITATION";
export const INVITATION_ACCEPT = "INVITATION_ACCEPT";
export const INVITATION_CLEAR = "INVITATION_CLEAR";

export const acceptInvitation = (manager: string, id: string) => {
  return {
    type: INVITATION_ACCEPT_REQUEST,
    payload: {
      manager,
      id
    }
  };
};

export default function invitationReducer(
  state: InvitationState = defaultState,
  action: any
): InvitationState {
  const { type, payload } = action;

  switch (type) {
    case "META_QUIT_TO_MAIN_MENU":
      return defaultState;

    case "META_GAME_LOAD_STATE":
      return payload.invitation;

    case INVITATION_ADD:
      return produce(state, (draft) => {
        draft.invitations.push({
          ...payload,
          id: crypto.randomUUID()
        });
      });

    case INVITATION_ACCEPT:
      return produce(state, (draft) => {
        const idx = draft.invitations.findIndex(
          (i) => i.manager === payload.manager && i.id === payload.id
        );
        if (idx !== -1) {
          draft.invitations[idx].participate = true;
        }
        draft.invitations = draft.invitations.filter(
          (i) => i.manager !== payload.manager || i.participate
        );
      });

    case SEASON_START:
      return produce(state, (draft) => {
        draft.invitations = [];
      });

    case GAME_DECREMENT_DURATIONS:
      return produce(state, (draft) => {
        for (const inv of draft.invitations) {
          if (!inv.participate) {
            inv.duration -= 1;
          }
        }
      });

    case GAME_CLEAR_EXPIRED:
      return produce(state, (draft) => {
        draft.invitations = draft.invitations.filter(
          (i) => i.participate || i.duration > 0
        );
      });

    default:
      return state;
  }
}
