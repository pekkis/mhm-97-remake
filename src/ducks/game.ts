import { produce } from "immer";
import { createAction } from "@reduxjs/toolkit";

import teamDefs from "../data/teams";
import managers from "../data/managers";
import type { ManagerDefinition } from "../data/managers";

import competitionList from "../data/competitions";
import { META_QUIT_TO_MAIN_MENU, META_GAME_LOAD_STATE } from "./meta";
import type { Competition, CompetitionId } from "../types/competitions";

// String constants kept for cross-duck reducer imports
export const GAME_START = "GAME_START";
export const GAME_ADVANCE_REQUEST = "GAME_ADVANCE_REQUEST";
export const GAME_ADVANCE = "GAME_ADVANCE";
export const GAME_DECREMENT_DURATIONS = "GAME_DECREMENT_DURATIONS";
export const GAME_CLEAR_EXPIRED = "GAME_CLEAR_EXPIRED";
export const GAME_NEXT_TURN = "GAME_NEXT_TURN";

export const SEASON_START = "SEASON_START";
export const SEASON_END = "SEASON_END";

// --- Action creators ---

// Game lifecycle
export const advance = createAction<any>(GAME_ADVANCE_REQUEST);
export const clearExpired = createAction(GAME_CLEAR_EXPIRED);
export const decrementDurations = createAction(GAME_DECREMENT_DURATIONS);
export const nextTurn = createAction(GAME_NEXT_TURN);
export const seasonEnd = createAction(SEASON_END);

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

export default function gameReducer(
  state: GameState = defaultState,
  action: any
): GameState {
  const { type, payload } = action;

  switch (type) {
    case META_QUIT_TO_MAIN_MENU:
      return defaultState;

    case META_GAME_LOAD_STATE:
      return payload.game;

    case "COMPETITION_REMOVE_TEAM":
      return produce(state, (draft) => {
        const comp = draft.competitions[payload.competition];
        comp.teams = comp.teams.filter((t) => t !== payload.team);
      });

    case "COMPETITION_ADD_TEAM":
      return produce(state, (draft) => {
        draft.competitions[payload.competition].teams.push(payload.team);
      });

    case "COMPETITION_UPDATE_STATS":
      return produce(state, (draft) => {
        draft.competitions[payload.competition].phases[payload.phase].groups[
          payload.group
        ].stats = payload.stats;
      });

    case "COMPETITION_SET_TEAMS":
      return produce(state, (draft) => {
        draft.competitions[payload.competition].teams = payload.teams;
      });

    case "COMPETITION_START":
      return produce(state, (draft) => {
        draft.competitions[payload.competition].phases = [];
      });

    case "COMPETITION_SEED":
      return produce(state, (draft) => {
        draft.competitions[payload.competition].phases[payload.phase] =
          payload.seed;
        draft.competitions[payload.competition].phase = payload.phase;
      });

    case SEASON_START:
      return produce(state, (draft) => {
        for (const t of draft.teams) {
          t.effects = [];
          t.opponentEffects = [];
          t.morale = 0;
          t.strategy = 2;
          t.readiness = 0;
        }
        draft.flags.jarko = false;
        for (const comp of Object.values(draft.competitions)) {
          comp.phase = -1;
          comp.phases = [];
        }
      });

    case SEASON_END:
      return produce(state, (draft) => {
        draft.turn.season += 1;
        draft.turn.round = -1;
      });

    case "GAME_GAME_RESULT":
      return produce(state, (draft) => {
        draft.competitions[payload.competition].phases[payload.phase].groups[
          payload.group
        ].schedule[payload.round][payload.pairing].result = payload.result;
      });

    case "GAME_GAMEDAY_COMPLETE":
      return produce(state, (draft) => {
        draft.competitions[payload.competition].phases[payload.phase].groups[
          payload.group
        ].round += 1;
      });

    case "GAME_SET_PHASE":
      return produce(state, (draft) => {
        draft.turn.phase = payload;
      });

    case "TEAM_INCREMENT_MORALE":
      return produce(state, (draft) => {
        const t = draft.teams[payload.team];
        t.morale = Math.min(
          payload.max,
          Math.max(payload.min, t.morale + payload.amount)
        );
      });

    case "TEAM_SET_MORALE":
      return produce(state, (draft) => {
        draft.teams[payload.team].morale = Math.min(
          payload.max,
          Math.max(payload.min, payload.morale)
        );
      });

    case "TEAM_SET_STRATEGY":
      return produce(state, (draft) => {
        draft.teams[payload.team].strategy = payload.strategy;
      });

    case "TEAM_SET_READINESS":
      return produce(state, (draft) => {
        draft.teams[payload.team].readiness = payload.readiness;
      });

    case "TEAM_INCUR_PENALTY":
      return produce(state, (draft) => {
        const group =
          draft.competitions[payload.competition].phases[payload.phase].groups[
            payload.group
          ];
        if (!("penalties" in group)) {
          (group as any).penalties = [];
        }
        (group as any).penalties.push({
          team: payload.team,
          penalty: payload.penalty
        });
      });

    case "TEAM_INCREMENT_READINESS":
      return produce(state, (draft) => {
        draft.teams[payload.team].readiness += payload.amount;
      });

    case "TEAM_INCREMENT_STRENGTH":
      return produce(state, (draft) => {
        draft.teams[payload.team].strength += payload.amount;
      });

    case "TEAM_SET_STRENGTH":
      return produce(state, (draft) => {
        draft.teams[payload.team].strength = payload.amount;
      });

    case "TEAM_SET_STRENGTHS":
      return produce(state, (draft) => {
        for (const entry of payload) {
          draft.teams[entry.id].strength = entry.strength;
        }
      });

    case "TEAM_DECREMENT_STRENGTH":
      return produce(state, (draft) => {
        draft.teams[payload.team].strength -= payload.amount;
      });

    case "TEAM_RENAME":
      return produce(state, (draft) => {
        draft.teams[payload.team].name = payload.name;
      });

    case "TEAM_ADD_EFFECT":
      return produce(state, (draft) => {
        draft.teams[payload.team].effects.push(payload.effect);
      });

    case "TEAM_ADD_OPPONENT_EFFECT":
      return produce(state, (draft) => {
        draft.teams[payload.team].opponentEffects.push(payload.effect);
      });

    case "TEAM_REMOVE_MANAGER":
      return produce(state, (draft) => {
        delete draft.teams[payload.team].manager;
      });

    case "TEAM_ADD_MANAGER":
      return produce(state, (draft) => {
        draft.teams[payload.team].manager = payload.manager;
      });

    case GAME_DECREMENT_DURATIONS:
      return produce(state, (draft) => {
        for (const team of draft.teams) {
          for (const e of team.effects) {
            e.duration -= 1;
          }
          for (const e of team.opponentEffects) {
            e.duration -= 1;
          }
        }
      });

    case GAME_CLEAR_EXPIRED:
      return produce(state, (draft) => {
        for (const team of draft.teams) {
          team.effects = team.effects.filter((e) => e.duration > 0);
          team.opponentEffects = team.opponentEffects.filter(
            (e) => e.duration > 0
          );
        }
      });

    case GAME_NEXT_TURN:
      return produce(state, (draft) => {
        draft.turn.round += 1;
      });

    case "GAME_SET_FLAG":
      return produce(state, (draft) => {
        (draft.flags as Record<string, GameFlags[keyof GameFlags]>)[
          payload.flag
        ] = payload.value;
      });

    case "GAME_SET_SERVICE_BASE_PRICE":
      return produce(state, (draft) => {
        draft.serviceBasePrices[payload.service] = payload.amount;
      });

    case "GAME_WORLD_CHAMPIONSHIP_RESULTS":
      return produce(state, (draft) => {
        draft.worldChampionshipResults = payload;
      });

    default:
      return state;
  }
}
