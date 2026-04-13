import { createAction, createReducer } from "@reduxjs/toolkit";
import { seasonStart, decrementDurations, clearExpired, syncFromMachine } from "./game";
import { quitToMainMenu, gameLoadState } from "./meta";

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

export const addInvitation = createAction<{
  manager: string;
  tournament: number;
  duration: number;
}>("INVITATION_ADD_INVITATION");

export const acceptInvitationAction = createAction<{
  manager: string;
  id: string;
}>("INVITATION_ACCEPT");

export const requestAcceptInvitation = createAction<{
  manager: string;
  id: string;
}>("INVITATION_ACCEPT_REQUEST");

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(gameLoadState, (_state, action) => action.payload.invitation)
    .addCase(syncFromMachine, (_state, action) => action.payload.invitation)
    .addCase(addInvitation, (state, action) => {
      state.invitations.push({
        ...action.payload,
        id: crypto.randomUUID()
      });
    })
    .addCase(acceptInvitationAction, (state, action) => {
      const { manager, id } = action.payload;
      const idx = state.invitations.findIndex(
        (i) => i.manager === manager && i.id === id
      );
      if (idx !== -1) {
        state.invitations[idx].participate = true;
      }
      state.invitations = state.invitations.filter(
        (i) => i.manager !== manager || i.participate
      );
    })
    .addCase(seasonStart, (state) => {
      state.invitations = [];
    })
    .addCase(decrementDurations, (state) => {
      for (const inv of state.invitations) {
        if (!inv.participate) {
          inv.duration -= 1;
        }
      }
    })
    .addCase(clearExpired, (state) => {
      state.invitations = state.invitations.filter(
        (i) => i.participate || i.duration > 0
      );
    });
});
