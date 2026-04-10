import { putResolve, call, select, put } from "typed-redux-saga";
import tournamentList from "../data/tournaments";

import { INVITATION_ADD, INVITATION_ACCEPT } from "../ducks/invitation";
import { addNotification } from "./notification";
import { managersTeamId } from "../data/selectors";
import { addTeamToCompetition } from "./game";
import type { RootState } from "../config/redux";

export function* acceptInvitation(managerId: string, id: string) {
  const team = yield* select(managersTeamId(managerId));

  yield* putResolve({
    type: INVITATION_ACCEPT,
    payload: { manager: managerId, id }
  });

  yield* call(addTeamToCompetition, "tournaments", team);

  yield* call(
    addNotification,
    managerId,
    "Hyväksyit turnauskutsun. Sihteerisi vastasi kaikkiin muihin potentiaalisiin turnauskutsuihin kieltävästi."
  );
}

export function* createInvitations() {
  const managers = yield* select((state: RootState) => state.manager.managers);

  for (const [managerId] of Object.entries(managers)) {
    for (
      let tournamentId = 0;
      tournamentId < tournamentList.length;
      tournamentId++
    ) {
      const tournament = tournamentList[tournamentId];
      const isInvited = yield* call(tournament.isInvited, managerId);
      if (isInvited) {
        yield* put({
          type: INVITATION_ADD,
          payload: {
            manager: managerId,
            tournament: tournamentId,
            duration: 3
          }
        });
      }
    }
  }
}
