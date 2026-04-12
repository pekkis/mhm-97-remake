import { select } from "typed-redux-saga";
import { managersMainCompetition, managersTeamId } from "@/selectors";
import type { RootState } from "../config/redux";
import type { CompetitionId, TeamStat } from "../types/competitions";

export function* isInvitedToTournament(
  competitionId: CompetitionId,
  maxRanking: number,
  manager: string
) {
  const mainCompetition = yield* select(managersMainCompetition(manager));
  const teamId = yield* select(managersTeamId(manager));
  if (mainCompetition !== competitionId) {
    return false;
  }

  const stats = yield* select(
    (state: RootState) =>
      state.game.competitions[mainCompetition].phases[0].groups[0]
        .stats as TeamStat[]
  );

  const ranking = stats.findIndex((stat) => stat.id === teamId);
  return ranking <= maxRanking;
}
