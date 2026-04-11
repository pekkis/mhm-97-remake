import type { Team } from "@/ducks/game";
import type {
  Competition,
  CompetitionDefinition,
  TournamentGroup
} from "../../types/competitions";
import tournamentScheduler from "@/services/tournament";
import type { Manager } from "@/ducks/manager";
import type { Invitation } from "@/ducks/invitation";
import tournamentList from "@/data/tournaments";
import random from "@/services/random";

export type TournamentSeedContext = {
  teams: Team[];
  managers: Record<string, Manager>;
  invitations: Invitation[];
};

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

  /*

  */

  /*

  */

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
    (
      competitions: Record<string, Competition>,
      context: TournamentSeedContext
    ) => {
      const { teams, invitations, managers } = context;

      // Build invited teams grouped by tournament index
      const invited: Map<number, number[]> = new Map();
      for (const inv of invitations) {
        const tournamentIdx = inv.tournament as number;
        const teamId = managers[inv.manager]?.team as number;
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
          .sort(() => random.real(1, 1000) - 500)
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
