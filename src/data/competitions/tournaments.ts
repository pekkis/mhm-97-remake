import { select, call, all } from "redux-saga/effects";
import tournamentScheduler from "../../services/tournament";
import r from "../../services/random";
import { foreignTeams } from "../selectors";

import tournamentList from "../tournaments";
import { setCompetitionTeams } from "../../sagas/game";
import { incrementReadiness } from "../../sagas/team";
import { addAnnouncement } from "../../sagas/news";
import { incrementBalance } from "../../sagas/manager";
import { amount as a } from "../../services/format";
import type {
  Competition,
  CompetitionDefinition,
  TeamStat,
  TournamentGroup
} from "../../types/competitions";
import type { Team } from "../../ducks/game";

const tournaments: CompetitionDefinition = {
  data: {
    weight: 2000,
    id: "tournaments",
    phase: -1,
    name: "Joulutauon turnaukset",
    abbr: "tournaments",
    phases: [],
    teams: []
  },

  relegateTo: false,
  promoteTo: false,

  start: function* () {
    yield call(setCompetitionTeams, "tournaments", []);
  },

  groupEnd: function* (phase, group) {
    const tournament: any = yield select(
      (state: any) =>
        state.game.competitions.tournaments.phases[phase].groups[group]
    );

    const managers: any = yield select((state: any) =>
      state.manager.get("managers")
    );
    const teams: any[] = yield select((state: any) => state.game.teams);

    for (const stat of tournament.stats as TeamStat[]) {
      const team = teams[stat.id];

      if (team.domestic) {
        yield call(incrementReadiness, team.id, -2);

        if (team.manager !== undefined) {
          const award = tournamentList[group].award;
          const manager = managers.get(team.manager);

          yield all([
            call(
              addAnnouncement,
              manager.get("id"),
              `Tilillenne on siirretty __${a(award)}__ pekkaa rahaa. Viiteviesti: joulutauon turnaus, osallistumismaksu, _${tournament.name}_.`
            ),
            call(incrementBalance, manager.get("id"), award)
          ]);
        }
      }
    }
  },

  gameBalance: (phase, facts, manager) => {
    return 0;
  },

  moraleBoost: (phase, facts, manager) => {
    return 0;
  },

  readinessBoost: (phase, facts, manager) => {
    return 0;
  },

  parameters: {
    gameday: (phase, group) => ({
      advantage: {
        home: (team) => 0,
        away: (team) => 0
      },
      base: () => 20,
      moraleEffect: (team) => {
        return team.morale * 2;
      }
    })
  },

  seed: [
    function* (competitions: Record<string, Competition>) {
      const teams: Team[] = yield select(foreignTeams);

      const managers: any = yield select((state: any) =>
        state.manager.get("managers")
      );

      const invitations: any = yield select((state: any) =>
        state.invitation
          .get("invitations")
          .filter((i: any) => i.get("participate"))
      );

      // Build invited teams grouped by tournament index
      const invited: Map<number, number[]> = new Map();
      for (const [, inv] of invitations.entries()) {
        const tournamentIdx = inv.get("tournament") as number;
        const teamId = managers.getIn([inv.get("manager"), "team"]) as number;
        if (!invited.has(tournamentIdx)) {
          invited.set(tournamentIdx, []);
        }
        invited.get(tournamentIdx)!.push(teamId);
      }

      let remainingTeams = [...teams];
      const groups: TournamentGroup[] = [];
      const allParticipantIds: number[] = [];

      for (const [tournamentIndex, tournament] of tournamentList.entries()) {
        const invitedTeamIds = invited.get(tournamentIndex) ?? [];

        const eligible = remainingTeams
          .filter(tournament.filter)
          .sort(() => r.real(1, 1000) - 500)
          .slice(0, 6 - invitedTeamIds.length)
          .map((t) => t.id);

        const participants = [...invitedTeamIds, ...eligible];

        groups.push({
          type: "tournament",
          penalties: [],
          colors: ["d", "l", "l", "l", "l", "l"],
          teams: participants,
          round: 0,
          name: tournament.name,
          schedule: tournamentScheduler(participants.length),
          stats: []
        });

        allParticipantIds.push(...participants);
        remainingTeams = remainingTeams.filter(
          (t) => !participants.includes(t.id)
        );
      }

      yield call(setCompetitionTeams, "tournaments", allParticipantIds);

      return {
        name: "jouluturnaukset",
        type: "tournament" as const,
        teams: allParticipantIds,
        groups
      };
    }
  ]
};

export default tournaments;
