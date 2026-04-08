import { produce } from "immer";
import { META_QUIT_TO_MAIN_MENU, META_GAME_LOAD_STATE } from "./meta";
import { SEASON_START, SEASON_END } from "./game";

export const STATS_UPDATE_FROM_FACTS = "STATS_UPDATE_FROM_FACTS";
export const STATS_SET_SEASON_STAT = "STATS_SET_SEASON_STAT";

export type Streak = {
  win: number;
  draw: number;
  loss: number;
  noLoss: number;
  noWin: number;
};

export type GameRecord = {
  win: number;
  draw: number;
  loss: number;
};

export type SeasonStats = {
  ehlChampion: number | undefined;
  presidentsTrophy: number | undefined;
  medalists: number[] | undefined;
  worldChampionships: any[] | undefined;
  promoted: number | undefined;
  relegated: number | undefined;
  stories: Record<string, any>;
};

export type StatsState = {
  managers: Record<string, { games: Record<string, Record<string, GameRecord>> }>;
  currentSeason: SeasonStats | undefined;
  seasons: SeasonStats[];
  streaks: {
    team: Record<string, Record<string, Streak>>;
    manager: Record<string, any>;
  };
};

const emptyStreak: Streak = {
  win: 0,
  draw: 0,
  loss: 0,
  noLoss: 0,
  noWin: 0
};

const emptySeasonStats: SeasonStats = {
  ehlChampion: undefined,
  presidentsTrophy: undefined,
  medalists: undefined,
  worldChampionships: undefined,
  promoted: undefined,
  relegated: undefined,
  stories: {}
};

const emptyGameRecord: GameRecord = {
  win: 0,
  draw: 0,
  loss: 0
};

const defaultState: StatsState = {
  managers: {},
  currentSeason: undefined,
  seasons: [],
  streaks: {
    team: {},
    manager: {}
  }
};

export default function statsReducer(
  state: StatsState = defaultState,
  action: any
): StatsState {
  const { type, payload } = action;

  switch (type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case META_GAME_LOAD_STATE:
      return payload.stats;

    case SEASON_START:
      return produce(state, (draft) => {
        draft.currentSeason = { ...emptySeasonStats, stories: {} };
      });

    case SEASON_END:
      return produce(state, (draft) => {
        if (draft.currentSeason) {
          draft.seasons.push(draft.currentSeason);
        }
      });

    case STATS_SET_SEASON_STAT: {
      const path: string[] = payload.path;
      const value = payload.value;
      return produce(state, (draft) => {
        if (!draft.currentSeason) return;
        let target: any = draft.currentSeason;
        for (let i = 0; i < path.length - 1; i++) {
          if (target[path[i]] === undefined) {
            target[path[i]] = {};
          }
          target = target[path[i]];
        }
        target[path[path.length - 1]] = value;
      });
    }

    case STATS_UPDATE_FROM_FACTS: {
      const { team, competition, phase, manager, facts } = payload;
      return produce(state, (draft) => {
        // Update team streaks
        if (!draft.streaks.team[team]) {
          draft.streaks.team[team] = {};
        }
        if (!draft.streaks.team[team][competition]) {
          draft.streaks.team[team][competition] = { ...emptyStreak };
        }
        const streak = draft.streaks.team[team][competition];
        streak.win = facts.isWin ? streak.win + 1 : 0;
        streak.draw = facts.isDraw ? streak.draw + 1 : 0;
        streak.loss = facts.isLoss ? streak.loss + 1 : 0;
        streak.noLoss =
          facts.isWin || facts.isDraw ? streak.noLoss + 1 : 0;
        streak.noWin =
          facts.isLoss || facts.isDraw ? streak.noWin + 1 : 0;

        // Update manager game stats
        if (manager) {
          if (!draft.managers[manager]) {
            draft.managers[manager] = { games: {} };
          }
          if (!draft.managers[manager].games[competition]) {
            draft.managers[manager].games[competition] = {};
          }
          if (!draft.managers[manager].games[competition][phase]) {
            draft.managers[manager].games[competition][phase] = {
              ...emptyGameRecord
            };
          }
          const record = draft.managers[manager].games[competition][phase];
          if (facts.isWin) {
            record.win += 1;
          } else if (facts.isLoss) {
            record.loss += 1;
          } else {
            record.draw += 1;
          }
        }
      });
    }

    default:
      return state;
  }
}
