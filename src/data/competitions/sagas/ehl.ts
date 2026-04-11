import type { RootState } from "@/config/redux";
import { setCompetitionTeams } from "@/sagas/game";
import { incrementBalance } from "@/sagas/manager";
import { addAnnouncement } from "@/sagas/news";
import { setSeasonStat } from "@/sagas/stats";
import { incrementReadiness, incrementStrength } from "@/sagas/team";
import random from "@/services/random";
import type { CompetitionSagaDefinition, TeamStat } from "@/types/competitions";
import { all, call, select } from "typed-redux-saga";

import { amount as a } from "@/services/format";

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

export const ehlSagas: CompetitionSagaDefinition = {
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
      () => random.real(1, 10000) - 5000
    );

    yield* call(setCompetitionTeams, "ehl", allTeams);
  },

  groupEnd: function* (phase) {
    if (phase === 1) {
      yield* call(ehlAwards);
    }
  }
};
