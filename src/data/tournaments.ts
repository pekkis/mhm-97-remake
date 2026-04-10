import { select } from "typed-redux-saga";
import { managersMainCompetition, managersTeamId } from "./selectors";
import { amount as a } from "../services/format";
import type { Team } from "../ducks/game";
import type { RootState } from "../config/redux";
import type { CompetitionId, TeamStat } from "../types/competitions";

type Tournament = {
  name: string;
  award: number;
  description: (amount: number) => string;
  isInvited: (manager: string) => Generator<any, boolean, any>;
  filter: (t: Team) => boolean;
};

const invitationCreator = (
  competitionId: CompetitionId,
  maxRanking: number
) => {
  return function* (manager: string) {
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
  };
};

const tournamentList: Tournament[] = [
  {
    name: "Christmas Cup",
    award: 300000,
    description: (amount) =>
      `__Christmas Cup__ on euroopan perinteisin, suurin ja seuratuin jokavuotinen kutsuturnaus. Mukana on seurajoukkueita monesta maasta, ja osallistumisesta on luvassa __${a(amount)}__ pekkaa.`,
    isInvited: invitationCreator("phl", 5),
    filter: (t) => t.strength > 200
  },
  {
    name: "Go-Go Cola Cup",
    award: 250000,
    description: (amount) =>
      `__GoGo Cola-Cup__ on ei-kovin-perinteikäs, miedosti tunnettu ja arvostettu joulunajan kutsuturnaus Kööpenhaminassa, Tanskassa, ja joukkuettasi on pyydetty mukaan. Osallistuminen kartuttaisi kassaa __${a(amount)}__ pekalla.`,
    isInvited: invitationCreator("phl", 9),
    filter: (t) => t.strength >= 150 && t.strength < 225
  },
  {
    name: "Cacca Cup",
    award: 100000,
    description: (amount) =>
      `Sloveniassa järjestettävään __Cacca Cupiin__ osallistuvat monet maanosan ehdottomat rupuseurat! Järjestäjät etsivät uusia jännittäviä kökköjoukkueita surkuhupaisaan pikku turnaukseensa, ja osallistumisesta on luvassa __${a(amount)}__ pekan palkkio.`,
    isInvited: invitationCreator("division", 5),
    filter: (t) => t.strength <= 175
  }
];

export default tournamentList;
