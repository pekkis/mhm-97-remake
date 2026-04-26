import type { RootState } from "@/config/redux";
import tournamentList from "@/data/tournaments";
import { setCompetitionTeams } from "@/sagas/game";
import { incrementBalance } from "@/sagas/manager";
import { addAnnouncement } from "@/sagas/news";
import { incrementReadiness } from "@/sagas/team";
import { amount } from "@/services/format";
import type { CompetitionSagaDefinition, TeamStat } from "@/types/competitions";
import { all, call, select } from "typed-redux-saga";

export const tournamentsSagas: CompetitionSagaDefinition = {
  start: function* () {
    yield* call(setCompetitionTeams, "tournaments", []);
  },

  groupEnd: function* (phase, group) {
    const tournament = yield* select(
      (state: RootState) =>
        state.game.competitions.tournaments.phases[phase].groups[group]
    );

    const managers = yield* select(
      (state: RootState) => state.manager.managers
    );
    const teams = yield* select((state: RootState) => state.game.teams);

    for (const stat of tournament.stats as TeamStat[]) {
      const team = teams[stat.id];

      if (team.domestic) {
        yield* call(incrementReadiness, team.id, -2);

        if (team.manager !== undefined) {
          const award = tournamentList[group].award;
          const manager = managers[team.manager];

          yield* all([
            call(
              addAnnouncement,
              manager.id,
              `Tilillenne on siirretty __${amount(award)}__ pekkaa rahaa. Viiteviesti: joulutauon turnaus, osallistumismaksu, _${tournament.name}_.`
            ),
            call(incrementBalance, manager.id, award)
          ]);
        }
      }
    }
  }
};
