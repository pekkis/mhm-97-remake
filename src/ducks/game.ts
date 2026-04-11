import { createAction, createReducer } from "@reduxjs/toolkit";

import teamDefs from "../data/teams";
import managers from "../data/managers";
import type { ManagerDefinition } from "../data/managers";

import competitionList from "../data/competitions";
import { quitToMainMenu, gameLoadState } from "./meta";
import type { Competition, CompetitionId } from "../types/competitions";

// --- Action creators ---

// Game lifecycle
export const advance = createAction<any>("GAME_ADVANCE_REQUEST");
export const clearExpired = createAction("GAME_CLEAR_EXPIRED");
export const decrementDurations = createAction("GAME_DECREMENT_DURATIONS");
export const nextTurn = createAction("GAME_NEXT_TURN");
export const seasonStart = createAction("SEASON_START");
export const seasonEnd = createAction("SEASON_END");

// Game state
export const setGamePhase = createAction<string>("GAME_SET_PHASE");
export const setGameFlag = createAction<{
  flag: string;
  value: unknown;
}>("GAME_SET_FLAG");
export const setServiceBasePrice = createAction<{
  service: string;
  amount: number;
}>("GAME_SET_SERVICE_BASE_PRICE");
export const setWorldChampionshipResults = createAction<
  WorldChampionshipEntry[]
>("GAME_WORLD_CHAMPIONSHIP_RESULTS");

// Gameday
export const gameBegin = createAction<{
  competition: string;
  phase: number;
  group: number;
  round: number;
  pairing: number;
}>("GAME_GAME_BEGIN");
export const gameResult = createAction<any>("GAME_GAME_RESULT");
export const gamedayComplete = createAction<{
  competition: string;
  phase: number;
  group: number;
  round: number;
}>("GAME_GAMEDAY_COMPLETE");
export const gameGroupEnd = createAction<{
  competition: string;
  phase: number;
  group: number;
}>("GAME_GROUP_END");

// Competition
export const competitionRemoveTeam = createAction<{
  competition: string;
  team: number;
}>("COMPETITION_REMOVE_TEAM");
export const competitionAddTeam = createAction<{
  competition: string;
  team: number;
}>("COMPETITION_ADD_TEAM");
export const competitionUpdateStats = createAction<any>(
  "COMPETITION_UPDATE_STATS"
);
export const competitionSetTeams = createAction<{
  competition: string;
  teams: number[];
}>("COMPETITION_SET_TEAMS");
export const competitionStart = createAction<{
  competition: string;
}>("COMPETITION_START");
export const competitionSeed = createAction<any>("COMPETITION_SEED");

// Team
export const teamIncrementMorale = createAction<{
  team: number;
  amount: number;
  min: number;
  max: number;
}>("TEAM_INCREMENT_MORALE");
export const teamSetMorale = createAction<{
  team: number;
  morale: number;
  min: number;
  max: number;
}>("TEAM_SET_MORALE");
export const teamSetStrategy = createAction<{
  team: number;
  strategy: number;
}>("TEAM_SET_STRATEGY");
export const teamSetReadiness = createAction<{
  team: number;
  readiness: number;
}>("TEAM_SET_READINESS");
export const teamIncurPenalty = createAction<{
  competition: string;
  phase: number;
  group: number;
  team: number;
  penalty: number;
}>("TEAM_INCUR_PENALTY");
export const teamIncrementReadiness = createAction<{
  team: number;
  amount: number;
}>("TEAM_INCREMENT_READINESS");
export const teamIncrementStrength = createAction<{
  team: number;
  amount: number;
}>("TEAM_INCREMENT_STRENGTH");
export const teamSetStrength = createAction<{
  team: number;
  amount: number;
}>("TEAM_SET_STRENGTH");
export const teamSetStrengths =
  createAction<{ id: number; strength: number }[]>("TEAM_SET_STRENGTHS");
export const teamDecrementStrength = createAction<{
  team: number;
  amount: number;
}>("TEAM_DECREMENT_STRENGTH");
export const teamRename = createAction<{
  team: number;
  name: string;
}>("TEAM_RENAME");
export const teamAddEffect = createAction<{
  team: number;
  effect: TeamEffect;
}>("TEAM_ADD_EFFECT");
export const teamAddOpponentEffect = createAction<{
  team: number;
  effect: TeamEffect;
}>("TEAM_ADD_OPPONENT_EFFECT");
export const teamRemoveManager = createAction<{
  team: number;
}>("TEAM_REMOVE_MANAGER");
export const teamAddManager = createAction<{
  team: number;
  manager: string;
}>("TEAM_ADD_MANAGER");

export type TeamEffect = {
  parameter: string[];
  amount: number | string;
  duration: number;
  extra?: Record<string, unknown>;
};

export type Team = {
  id: number;
  name: string;
  strength: number;
  domestic: boolean;
  morale: number;
  strategy: number;
  readiness: number;
  effects: TeamEffect[];
  opponentEffects: TeamEffect[];
  manager?: string;
};

export type GameFlags = {
  jarko: boolean;
  usa: boolean;
  canada: boolean;
  haanperaMarried: boolean;
  mauto: boolean;
  psycho: number | undefined;
};

export type WorldChampionshipEntry = {
  id: string;
  name: string;
  strength: number;
  luck: number;
  random: number;
};

type GameState = {
  turn: { season: number; round: number; phase: string | undefined };
  flags: GameFlags;
  serviceBasePrices: Record<string, number>;
  managers: ManagerDefinition[];
  competitions: Record<CompetitionId, Competition>;
  teams: Team[];
  worldChampionshipResults: WorldChampionshipEntry[] | undefined;
};

const defaultState: GameState = {
  turn: { season: 0, round: 0, phase: undefined },
  flags: {
    jarko: false,
    usa: false,
    canada: false,
    haanperaMarried: false,
    mauto: false,
    psycho: undefined
  },
  serviceBasePrices: {
    insurance: 1000,
    coach: 3200,
    microphone: 500,
    cheer: 3000
  },
  managers,
  competitions: Object.fromEntries(
    Object.entries(competitionList).map(([key, def]) => [key, { ...def.data }])
  ) as Record<CompetitionId, Competition>,
  teams: teamDefs.map((t) => ({
    id: t.id,
    name: t.name,
    strength: t.strength(),
    domestic: t.domestic,
    morale: 0,
    strategy: 2,
    readiness: 0,
    effects: [],
    opponentEffects: []
  })),
  worldChampionshipResults: undefined
};

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(gameLoadState, (_state, action) => action.payload.game)
    .addCase(competitionRemoveTeam, (state, action) => {
      const comp = state.competitions[action.payload.competition];
      comp.teams = comp.teams.filter((t) => t !== action.payload.team);
    })
    .addCase(competitionAddTeam, (state, action) => {
      state.competitions[action.payload.competition].teams.push(
        action.payload.team
      );
    })
    .addCase(competitionUpdateStats, (state, action) => {
      state.competitions[action.payload.competition].phases[
        action.payload.phase
      ].groups[action.payload.group].stats = action.payload.stats;
    })
    .addCase(competitionSetTeams, (state, action) => {
      state.competitions[action.payload.competition].teams =
        action.payload.teams;
    })
    .addCase(competitionStart, (state, action) => {
      state.competitions[action.payload.competition].phases = [];
    })
    .addCase(competitionSeed, (state, action) => {
      state.competitions[action.payload.competition].phases[
        action.payload.phase
      ] = action.payload.seed;
      state.competitions[action.payload.competition].phase =
        action.payload.phase;
    })
    .addCase(seasonStart, (state) => {
      for (const t of state.teams) {
        t.effects = [];
        t.opponentEffects = [];
        t.morale = 0;
        t.strategy = 2;
        t.readiness = 0;
      }
      state.flags.jarko = false;
      for (const comp of Object.values(state.competitions)) {
        comp.phase = -1;
        comp.phases = [];
      }
    })
    .addCase(seasonEnd, (state) => {
      state.turn.season += 1;
      state.turn.round = -1;
    })
    .addCase(gameResult, (state, action) => {
      state.competitions[action.payload.competition].phases[
        action.payload.phase
      ].groups[action.payload.group].schedule[action.payload.round][
        action.payload.pairing
      ].result = action.payload.result;
    })
    .addCase(gamedayComplete, (state, action) => {
      state.competitions[action.payload.competition].phases[
        action.payload.phase
      ].groups[action.payload.group].round += 1;
    })
    .addCase(setGamePhase, (state, action) => {
      state.turn.phase = action.payload;
    })
    .addCase(teamIncrementMorale, (state, action) => {
      const t = state.teams[action.payload.team];
      t.morale = Math.min(
        action.payload.max,
        Math.max(action.payload.min, t.morale + action.payload.amount)
      );
    })
    .addCase(teamSetMorale, (state, action) => {
      state.teams[action.payload.team].morale = Math.min(
        action.payload.max,
        Math.max(action.payload.min, action.payload.morale)
      );
    })
    .addCase(teamSetStrategy, (state, action) => {
      state.teams[action.payload.team].strategy = action.payload.strategy;
    })
    .addCase(teamSetReadiness, (state, action) => {
      state.teams[action.payload.team].readiness = action.payload.readiness;
    })
    .addCase(teamIncurPenalty, (state, action) => {
      const group =
        state.competitions[action.payload.competition].phases[
          action.payload.phase
        ].groups[action.payload.group];
      if (!("penalties" in group)) {
        (group as any).penalties = [];
      }
      (group as any).penalties.push({
        team: action.payload.team,
        penalty: action.payload.penalty
      });
    })
    .addCase(teamIncrementReadiness, (state, action) => {
      state.teams[action.payload.team].readiness += action.payload.amount;
    })
    .addCase(teamIncrementStrength, (state, action) => {
      state.teams[action.payload.team].strength += action.payload.amount;
    })
    .addCase(teamSetStrength, (state, action) => {
      state.teams[action.payload.team].strength = action.payload.amount;
    })
    .addCase(teamSetStrengths, (state, action) => {
      for (const entry of action.payload) {
        state.teams[entry.id].strength = entry.strength;
      }
    })
    .addCase(teamDecrementStrength, (state, action) => {
      state.teams[action.payload.team].strength -= action.payload.amount;
    })
    .addCase(teamRename, (state, action) => {
      state.teams[action.payload.team].name = action.payload.name;
    })
    .addCase(teamAddEffect, (state, action) => {
      state.teams[action.payload.team].effects.push(action.payload.effect);
    })
    .addCase(teamAddOpponentEffect, (state, action) => {
      state.teams[action.payload.team].opponentEffects.push(
        action.payload.effect
      );
    })
    .addCase(teamRemoveManager, (state, action) => {
      delete state.teams[action.payload.team].manager;
    })
    .addCase(teamAddManager, (state, action) => {
      state.teams[action.payload.team].manager = action.payload.manager;
    })
    .addCase(decrementDurations, (state) => {
      for (const team of state.teams) {
        for (const e of team.effects) {
          e.duration -= 1;
        }
        for (const e of team.opponentEffects) {
          e.duration -= 1;
        }
      }
    })
    .addCase(clearExpired, (state) => {
      for (const team of state.teams) {
        team.effects = team.effects.filter((e) => e.duration > 0);
        team.opponentEffects = team.opponentEffects.filter(
          (e) => e.duration > 0
        );
      }
    })
    .addCase(nextTurn, (state) => {
      state.turn.round += 1;
    })
    .addCase(setGameFlag, (state, action) => {
      (state.flags as Record<string, unknown>)[action.payload.flag] =
        action.payload.value;
    })
    .addCase(setServiceBasePrice, (state, action) => {
      state.serviceBasePrices[action.payload.service] = action.payload.amount;
    })
    .addCase(setWorldChampionshipResults, (state, action) => {
      state.worldChampionshipResults = action.payload;
    });
});
