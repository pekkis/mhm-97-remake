import { Map, List } from "immutable";
import { produce } from "immer";

import teams from "../data/teams";
import managers from "../data/managers";

import competitionList from "../data/competitions";
import { META_QUIT_TO_MAIN_MENU, META_GAME_LOAD_STATE } from "./meta";

export const GAME_START = "GAME_START";
export const GAME_ADVANCE_REQUEST = "GAME_ADVANCE_REQUEST";
export const GAME_ADVANCE = "GAME_ADVANCE";
export const GAME_DECREMENT_DURATIONS = "GAME_DECREMENT_DURATIONS";
export const GAME_CLEAR_EXPIRED = "GAME_CLEAR_EXPIRED";
export const GAME_NEXT_TURN = "GAME_NEXT_TURN";

export const SEASON_START = "SEASON_START";
export const SEASON_END = "SEASON_END";

type GameState = {
  turn: { season: number; round: number; phase: string | undefined };
  flags: Record<string, boolean>;
  serviceBasePrices: Record<string, number>;
  managers: any;
  competitions: any;
  teams: any;
  worldChampionshipResults: any;
};

const defaultState: GameState = {
  turn: { season: 0, round: 0, phase: undefined },
  flags: { jarko: false, usa: false, canada: false },
  serviceBasePrices: {
    insurance: 1000,
    coach: 3200,
    microphone: 500,
    cheer: 3000
  },
  managers,
  competitions: competitionList.map((c: any) => c.get("data")),
  teams: List(teams.map((t) => Map({ ...t, strength: t.strength() }))),
  worldChampionshipResults: undefined
};

export const advance = (payload: any) => {
  return {
    type: GAME_ADVANCE_REQUEST,
    payload
  };
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
        draft.competitions = draft.competitions.updateIn(
          [payload.competition, "teams"],
          (teams: any) => teams.filterNot((t: any) => t === payload.team)
        );
      });

    case "COMPETITION_ADD_TEAM":
      return produce(state, (draft) => {
        draft.competitions = draft.competitions.updateIn(
          [payload.competition, "teams"],
          (teams: any) => teams.push(payload.team)
        );
      });

    case "COMPETITION_UPDATE_STATS":
      return produce(state, (draft) => {
        draft.competitions = draft.competitions.setIn(
          [
            payload.competition,
            "phases",
            payload.phase,
            "groups",
            payload.group,
            "stats"
          ],
          payload.stats
        );
      });

    case "COMPETITION_SET_TEAMS":
      return produce(state, (draft) => {
        draft.competitions = draft.competitions.setIn(
          [payload.competition, "teams"],
          payload.teams
        );
      });

    case "COMPETITION_START":
      return produce(state, (draft) => {
        draft.competitions = draft.competitions.update(
          payload.competition,
          (c: any) => c.set("phases", List())
        );
      });

    case "COMPETITION_SEED":
      return produce(state, (draft) => {
        draft.competitions = draft.competitions
          .setIn([payload.competition, "phases", payload.phase], payload.seed)
          .setIn([payload.competition, "phase"], payload.phase);
      });

    case SEASON_START:
      return produce(state, (draft) => {
        draft.teams = draft.teams.map((t: any) => {
          return t
            .set("effects", List())
            .set("opponentEffects", List())
            .set("morale", 0)
            .set("strategy", 2)
            .set("readiness", 0);
        });
        draft.flags.jarko = false;
        draft.competitions = draft.competitions.map((competition: any) =>
          competition.set("phase", -1).set("phases", List())
        );
      });

    case SEASON_END:
      return produce(state, (draft) => {
        draft.turn.season += 1;
        draft.turn.round = -1;
      });

    case "GAME_GAME_RESULT":
      return produce(state, (draft) => {
        draft.competitions = draft.competitions.setIn(
          [
            payload.competition,
            "phases",
            payload.phase,
            "groups",
            payload.group,
            "schedule",
            payload.round,
            payload.pairing,
            "result"
          ],
          payload.result
        );
      });

    case "GAME_GAMEDAY_COMPLETE":
      return produce(state, (draft) => {
        draft.competitions = draft.competitions.updateIn(
          [
            payload.competition,
            "phases",
            payload.phase,
            "groups",
            payload.group
          ],
          (group: any) => group.update("round", (r: number) => r + 1)
        );
      });

    case "GAME_SET_PHASE":
      return produce(state, (draft) => {
        draft.turn.phase = payload;
      });

    case "TEAM_INCREMENT_MORALE":
      return produce(state, (draft) => {
        draft.teams = draft.teams.updateIn(
          [payload.team, "morale"],
          (m: number) =>
            Math.min(payload.max, Math.max(payload.min, m + payload.amount))
        );
      });

    case "TEAM_SET_MORALE":
      return produce(state, (draft) => {
        draft.teams = draft.teams.setIn(
          [payload.team, "morale"],
          Math.min(payload.max, Math.max(payload.min, payload.morale))
        );
      });

    case "TEAM_SET_STRATEGY":
      return produce(state, (draft) => {
        draft.teams = draft.teams.setIn(
          [payload.team, "strategy"],
          payload.strategy
        );
      });

    case "TEAM_SET_READINESS":
      return produce(state, (draft) => {
        draft.teams = draft.teams.setIn(
          [payload.team, "readiness"],
          payload.readiness
        );
      });

    case "TEAM_INCUR_PENALTY":
      return produce(state, (draft) => {
        draft.competitions = draft.competitions.updateIn(
          [
            payload.competition,
            "phases",
            payload.phase,
            "groups",
            payload.group,
            "penalties"
          ],
          List(),
          (penalties: any) =>
            penalties.push(
              Map({ team: payload.team, penalty: payload.penalty })
            )
        );
      });

    case "TEAM_INCREMENT_READINESS":
      return produce(state, (draft) => {
        draft.teams = draft.teams.updateIn(
          [payload.team, "readiness"],
          (r: number) => r + payload.amount
        );
      });

    case "TEAM_INCREMENT_STRENGTH":
      return produce(state, (draft) => {
        draft.teams = draft.teams.updateIn(
          [payload.team, "strength"],
          (m: number) => m + payload.amount
        );
      });

    case "TEAM_SET_STRENGTH":
      return produce(state, (draft) => {
        draft.teams = draft.teams.setIn(
          [payload.team, "strength"],
          payload.amount
        );
      });

    case "TEAM_SET_STRENGTHS":
      return produce(state, (draft) => {
        draft.teams = payload.reduce((teams: any, entry: any) => {
          return teams.setIn([entry.id, "strength"], entry.strength);
        }, draft.teams);
      });

    case "TEAM_DECREMENT_STRENGTH":
      return produce(state, (draft) => {
        draft.teams = draft.teams.updateIn(
          [payload.team, "strength"],
          (m: number) => m - payload.amount
        );
      });

    case "TEAM_RENAME":
      return produce(state, (draft) => {
        draft.teams = draft.teams.setIn([payload.team, "name"], payload.name);
      });

    case "TEAM_ADD_EFFECT":
      return produce(state, (draft) => {
        draft.teams = draft.teams.updateIn(
          [payload.team, "effects"],
          (effects: any) => effects.push(Map(payload.effect))
        );
      });

    case "TEAM_ADD_OPPONENT_EFFECT":
      return produce(state, (draft) => {
        draft.teams = draft.teams.updateIn(
          [payload.team, "opponentEffects"],
          (opponentEffects: any) => opponentEffects.push(Map(payload.effect))
        );
      });

    case "TEAM_REMOVE_MANAGER":
      return produce(state, (draft) => {
        draft.teams = draft.teams.removeIn([payload.team, "manager"]);
      });

    case "TEAM_ADD_MANAGER":
      return produce(state, (draft) => {
        draft.teams = draft.teams.setIn(
          [payload.team, "manager"],
          payload.manager
        );
      });

    case GAME_DECREMENT_DURATIONS:
      return produce(state, (draft) => {
        draft.teams = draft.teams.map((team: any) => {
          return team
            .update("effects", (effects: any) =>
              effects.map((e: any) =>
                e.update("duration", (d: number) => d - 1)
              )
            )
            .update("opponentEffects", (effects: any) =>
              effects.map((e: any) =>
                e.update("duration", (d: number) => d - 1)
              )
            );
        });
      });

    case GAME_CLEAR_EXPIRED:
      return produce(state, (draft) => {
        draft.teams = draft.teams.map((team: any) => {
          return team
            .update("effects", (effects: any) =>
              effects.filter((e: any) => e.get("duration") > 0)
            )
            .update("opponentEffects", (effects: any) =>
              effects.filter((e: any) => e.get("duration") > 0)
            );
        });
      });

    case GAME_NEXT_TURN:
      return produce(state, (draft) => {
        draft.turn.round += 1;
      });

    case "GAME_SET_FLAG":
      return produce(state, (draft) => {
        draft.flags[payload.flag] = payload.value;
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
