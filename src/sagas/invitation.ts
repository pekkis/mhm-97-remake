import { call, select, put } from "typed-redux-saga";
import tournamentList from "@/data/tournaments";
import { isInvitedToTournament } from "./tournament-eligibility";

import { addInvitation, acceptInvitationAction } from "@/ducks/invitation";
import { addNotification } from "./notification";
import { managersTeamId } from "@/selectors";
import { addTeamToCompetition } from "./game";
import type { RootState } from "@/config/redux";
import { entries } from "remeda";

export function* acceptInvitation(managerId: string, id: string) {
  const team = yield* select(managersTeamId(managerId));

  yield* put(acceptInvitationAction({ manager: managerId, id }));

  yield* call(addTeamToCompetition, "tournaments", team);

  yield* call(
    addNotification,
    managerId,
    "Hyväksyit turnauskutsun. Sihteerisi vastasi kaikkiin muihin potentiaalisiin turnauskutsuihin kieltävästi."
  );
}

export function* createInvitations() {
  const managers = yield* select((state: RootState) => state.manager.managers);

  for (const [managerId] of entries(managers)) {
    for (
      let tournamentId = 0;
      tournamentId < tournamentList.length;
      tournamentId++
    ) {
      const tournament = tournamentList[tournamentId];
      const { competitionId, maxRanking } = tournament.eligibility;
      const isInvited = yield* call(
        isInvitedToTournament,
        competitionId,
        maxRanking,
        managerId
      );
      if (isInvited) {
        yield* put(
          addInvitation({
            manager: managerId,
            tournament: tournamentId,
            duration: 3
          })
        );
      }
    }
  }
}
