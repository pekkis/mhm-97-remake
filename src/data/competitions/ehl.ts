import { select, call, all } from "typed-redux-saga";
import { scheduler as roundRobinScheduler } from "../../services/round-robin";
import tournamentScheduler from "../../services/tournament";
import table, { sortStats } from "../../services/league";
import r from "../../services/random";
import { defaultMoraleBoost } from "../../services/morale";
import { addAnnouncement } from "../../sagas/news";
import { amount as a } from "../../services/format";
import { incrementStrength, incrementReadiness } from "../../sagas/team";
import { incrementBalance } from "../../sagas/manager";
import { setSeasonStat } from "../../sagas/stats";
import { setCompetitionTeams } from "../../sagas/game";
import type {
  Competition,
  CompetitionDefinition,
  TeamStat
} from "../../types/competitions";
import type { RootState } from "../../config/redux";

type Award = {
  amount: number;
  strength: number;
  text: (amount: number) => string;
};

const awards: Award[] = [
  {
    amount: 2000000,
    strength: 30,
    text: (amount) =>
      `Voitimme jääkiekon euroopan mestaruuden. Johtokunta onnittelee menestyksekästä joukkuetta ja sen manageria yksissä tuumin. Sielua lämmittävän kiittelyn ohella joukkueen tilille napsahtaa aimo summa pätäkkää, kaiken kaikkiaan __${a(amount)}__ pekkaa. `
  },
  {
    amount: 1600000,
    strength: 28,
    text: (amount) =>
      `Sijoituimme toiseksi EHL:n lopputurnauksessa. Hopea ei ole häpeä, ja johtokunta on samaan aikaan onnellinen saavutuksesta mutta haikea saavuttamattomasta. Onneksi palkkiosumma, __${a(amount)}__ pekkaa, lohduttaa tasaisesti kaikkia asianosaisia.`
  },
  {
    amount: 1400000,
    strength: 26,
    text: (amount) =>
      `Sijoituimme kolmanneksi EHL:n lopputurnauksessa. Himmeinkin mitali kelpaa, ja johtokunta on miedosti onnellinen saavutuksestanne. Kättelyt ovat ainakin kädenlämpöisiä, ja rahapalkkio, __${a(amount)}__ pekkaa, kyllä kelpaa aivan jokaiselle.`
  },
  {
    amount: 1200000,
    strength: 24,
    text: (amount) =>
      `Sijoituimme neljänneksi EHL:n lopputurnauksessa. Johtokunta tunnustaa haaveilleensa paremmasta, mutta ottaa silti ilolla vastaan rahapalkkion, __${a(amount)}__ pekkaa.`
  },
  {
    amount: 1000000,
    strength: 22,
    text: (amount) =>
      `Sijoituimme viidenneksi EHL:n lopputurnauksessa. Johtokunta nyreilee ja kyräilee, he odottivat joukkueelta selvästi enemmän. Rahapalkkio, __${a(amount)}__ pekkaa, kelpaa heille kyllä, mutta se ei kuulemma "lohduta heitä pimeinä talvi-iltoina".`
  },
  {
    amount: 800000,
    strength: 20,
    text: (amount) =>
      `Sijoituimme viimeiseksi EHL:n lopputurnauksessa. No, ainakin kohtuullinen rahapalkkio, __${a(amount)}__ pekkaa, napsahtaa tilillenne.`
  }
];

function* ehlAwards() {
  const finalTournament = yield* select(
    (state: RootState) => state.game.competitions.ehl.phases[1].groups[0]
  );

  const managers = yield* select((state: RootState) => state.manager.managers);
  const teams = yield* select((state: RootState) => state.game.teams);

  for (const [ranking, stat] of (
    finalTournament.stats as TeamStat[]
  ).entries()) {
    const team = teams[stat.id];

    if (ranking === 0) {
      yield* call(setSeasonStat, ["ehlChampion"], team.id);
    }

    if (team.domestic) {
      yield* call(incrementReadiness, team.id, -2);

      if (team.manager !== undefined) {
        const award = awards[ranking];
        const manager = managers[team.manager];

        yield* all([
          call(addAnnouncement, manager.id, award.text(award.amount)),
          call(incrementBalance, manager.id, award.amount)
        ]);
      } else {
        yield* call(incrementStrength, team.id, awards[ranking].strength);
      }
    }
  }
}

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

  start: function* () {
    const turn = yield* select((state: RootState) => state.game.turn);
    const season = turn.season;

    const ehlTeams: number[] = yield* select(
      (state: RootState) =>
        state.stats.seasons?.[season - 1]?.medalists ?? [2, 3, 5]
    );

    const foreignTeamIds = yield* select((state: RootState) =>
      state.game.teams.slice(24, 24 + 17).map((t) => t.id)
    );

    const allTeams = [...ehlTeams, ...foreignTeamIds].toSorted(
      () => r.real(1, 10000) - 5000
    );

    yield* call(setCompetitionTeams, "ehl", allTeams);
  },

  groupEnd: function* (phase, group) {
    if (phase === 1) {
      yield* call(ehlAwards);
    }
  },

  gameBalance: (phase, facts, manager) => {
    if (phase > 0) {
      return 0;
    }

    const arenaLevel = manager.arena.level + 1;
    return 100000 + 20000 * arenaLevel;
  },

  moraleBoost: (phase, facts, manager) => {
    if (phase > 0) {
      return 0;
    }

    return defaultMoraleBoost(facts);
  },

  readinessBoost: (phase, facts, manager) => {
    if (phase > 0) {
      return 0;
    }
    return -1;
  },

  parameters: {
    gameday: (phase) => ({
      advantage: {
        home: (team) => (phase === 0 ? 10 : 0),
        away: (team) => (phase === 0 ? -10 : 0)
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
