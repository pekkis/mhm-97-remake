import table, { sortStats } from "@/services/league";
import { defaultMoraleBoost } from "@/services/morale";
import { scheduler as roundRobinScheduler } from "@/services/round-robin";
import tournamentScheduler from "@/services/tournament";
import type { Competition, CompetitionDefinition } from "@/types/competitions";

const ehl: CompetitionDefinition = {
  data: {
    weight: 2000,
    id: "ehl",
    phase: -1,
    name: "EHL",
    abbr: "ehl",
    teams: [],
    phases: []
  },

  relegateTo: false,
  promoteTo: false,

  gameBalance: (phase, _facts, manager) => {
    if (phase > 0) {
      return 0;
    }

    const arenaLevel = manager.arena.level + 1;
    return 100000 + 20000 * arenaLevel;
  },

  moraleBoost: (phase, facts, _manager) => {
    if (phase > 0) {
      return 0;
    }

    return defaultMoraleBoost(facts);
  },

  readinessBoost: (phase, _facts, _manager) => {
    if (phase > 0) {
      return 0;
    }
    return -1;
  },

  parameters: {
    gameday: (phase) => ({
      advantage: {
        home: (_team) => (phase === 0 ? 10 : 0),
        away: (_team) => (phase === 0 ? -10 : 0)
      },
      base: () => 20,
      moraleEffect: (team) => {
        return team.morale * 2;
      }
    })
  },

  seed: [
    (competitions: Record<string, Competition>) => {
      const times = 1;
      const ehlComp = competitions.ehl;
      const teams = ehlComp.teams;

      const groups = Array.from({ length: 5 }, (_, groupId) => {
        const teamSlice = teams.slice(groupId * 4, groupId * 4 + 4);
        return {
          type: "round-robin" as const,
          round: 0,
          name: `lohko ${groupId + 1}`,
          teams: teamSlice,
          schedule: roundRobinScheduler(teamSlice.length, times),
          colors: ["d", "l", "l", "l"],
          penalties: [],
          stats: []
        };
      });

      return {
        teams,
        name: "runkosarja",
        type: "round-robin" as const,
        groups
      };
    },
    (competitions: Record<string, Competition>) => {
      const ehlGroups = competitions.ehl.phases[0].groups;
      const ehlTables = ehlGroups.map(table);

      const qualifiedVictors = ehlTables.map((t) => t[0]);

      const allSeconds = ehlTables.flatMap((t) => t.slice(1));
      const sorted = sortStats(allSeconds);
      const qualifiedSecond = sorted[0];

      const teams = [...qualifiedVictors, qualifiedSecond].map((e) => e.id);

      console.log("Qualified teams", teams);

      return {
        name: "lopputurnaus",
        type: "tournament" as const,
        teams,
        groups: [
          {
            type: "tournament" as const,
            penalties: [],
            colors: ["d", "l", "l", "l", "l", "l"],
            teams,
            round: 0,
            name: "lopputurnaus",
            schedule: tournamentScheduler(teams.length),
            stats: []
          }
        ]
      };
    }
  ]
};

export default ehl;
