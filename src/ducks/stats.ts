import { createAction, createReducer } from "@reduxjs/toolkit";
import type {
  GameRecord,
  SeasonStats,
  StatsState,
  Streak
} from "@/state/stats";
import { quitToMainMenu, gameLoadState } from "./meta";
import { seasonStart, seasonEnd, syncFromMachine } from "./game";

export const updateFromFacts = createAction<{
  team: string;
  competition: string;
  phase: string;
  manager: string | undefined;
  facts: { isWin: boolean; isDraw: boolean; isLoss: boolean };
}>("STATS_UPDATE_FROM_FACTS");

export const setSeasonStat = createAction<{
  path: string[];
  value: unknown;
}>("STATS_SET_SEASON_STAT");

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

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(gameLoadState, (_state, action) => action.payload.stats)
    .addCase(syncFromMachine, (_state, action) => action.payload.stats)
    .addCase(seasonStart, (state) => {
      state.currentSeason = { ...emptySeasonStats, stories: {} };
    })
    .addCase(seasonEnd, (state) => {
      if (state.currentSeason) {
        state.seasons.push(state.currentSeason);
      }
    })
    .addCase(setSeasonStat, (state, action) => {
      const { path, value } = action.payload;
      if (!state.currentSeason) {
        return;
      }
      let target: any = state.currentSeason;
      for (let i = 0; i < path.length - 1; i++) {
        if (target[path[i]] === undefined) {
          target[path[i]] = {};
        }
        target = target[path[i]];
      }
      target[path[path.length - 1]] = value;
    })
    .addCase(updateFromFacts, (state, action) => {
      const { team, competition, phase, manager, facts } = action.payload;

      // Update team streaks
      if (!state.streaks.team[team]) {
        state.streaks.team[team] = {};
      }
      if (!state.streaks.team[team][competition]) {
        state.streaks.team[team][competition] = { ...emptyStreak };
      }
      const streak = state.streaks.team[team][competition];
      streak.win = facts.isWin ? streak.win + 1 : 0;
      streak.draw = facts.isDraw ? streak.draw + 1 : 0;
      streak.loss = facts.isLoss ? streak.loss + 1 : 0;
      streak.noLoss = facts.isWin || facts.isDraw ? streak.noLoss + 1 : 0;
      streak.noWin = facts.isLoss || facts.isDraw ? streak.noWin + 1 : 0;

      // Update manager game stats
      if (manager) {
        if (!state.managers[manager]) {
          state.managers[manager] = { games: {} };
        }
        if (!state.managers[manager].games[competition]) {
          state.managers[manager].games[competition] = {};
        }
        if (!state.managers[manager].games[competition][phase]) {
          state.managers[manager].games[competition][phase] = {
            ...emptyGameRecord
          };
        }
        const record = state.managers[manager].games[competition][phase];
        if (facts.isWin) {
          record.win += 1;
        } else if (facts.isLoss) {
          record.loss += 1;
        } else {
          record.draw += 1;
        }
      }
    });
});
