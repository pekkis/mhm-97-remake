import { matchups } from "../services/playoffs";
import table from "../services/league";
import type {
  GameResult,
  Group,
  MatchupStat,
  PlayoffGroup,
  TeamStat
} from "../types/competitions";

type CompetitionType = {
  playMatch: (
    phase: PlayoffGroup | Group,
    round: number,
    matchup: number
  ) => boolean;
  overtime: (result: GameResult) => boolean;
  stats: (group: Group) => TeamStat[] | MatchupStat[];
};

const competitionTypes: Record<string, CompetitionType> = {
  "round-robin": {
    playMatch: () => true,
    overtime: () => false,
    stats: (group) => {
      return table(group);
    }
  },
  tournament: {
    playMatch: () => true,
    overtime: () => false,
    stats: (group) => {
      return table(group);
    }
  },
  playoffs: {
    stats: (group) => {
      return matchups(group as PlayoffGroup);
    },
    playMatch: (phase, _round, matchup) => {
      const p = phase as PlayoffGroup;
      const situation = p.stats;
      const match = situation[matchup] as MatchupStat;

      if (match.home.wins === p.winsToAdvance) {
        console.log("HOME TEAM HAS ENUFF WINS");
        return false;
      }

      if (match.away.wins === p.winsToAdvance) {
        console.log("AWAY TEAM HAS ENUFF WINS");
        return false;
      }

      return true;
    },
    overtime: (result) => {
      return result.home === result.away;
    }
  }
};

export default competitionTypes;
