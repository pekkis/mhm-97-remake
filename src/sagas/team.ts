import { put, call, select, putResolve } from "typed-redux-saga";
import { teamsManager } from "../data/selectors";
import difficultyLevels from "../data/difficulty-levels";
import { calculateGroupStats } from "./stats";
import type { Manager } from "../ducks/manager";

const getMoraleMinMax = (manager: Manager | undefined) => {
  const difficulty = manager ? manager.difficulty : 2;

  return {
    min: difficultyLevels[difficulty].moraleMin,
    max: difficultyLevels[difficulty].moraleMax
  };
};

export function* incurPenalty(
  competition: string,
  phase: number,
  group: number,
  team: number,
  penalty: number
) {
  yield* putResolve({
    type: "TEAM_INCUR_PENALTY" as const,
    payload: {
      competition,
      phase,
      group,
      team,
      penalty
    }
  });
  yield* call(calculateGroupStats, competition, phase, group);
}

export function* setStrategy(teamId: number, strategy: number) {
  return yield* put({
    type: "TEAM_SET_STRATEGY" as const,
    payload: {
      team: teamId,
      strategy
    }
  });
}

export function* setMorale(teamId: number, morale: number) {
  const manager = yield* select(teamsManager(teamId));
  const { min, max } = getMoraleMinMax(manager);

  return yield* put({
    type: "TEAM_SET_MORALE" as const,
    payload: {
      team: teamId,
      morale,
      min,
      max
    }
  });
}

export function* incrementMorale(teamId: number, amount: number) {
  const manager = yield* select(teamsManager(teamId));

  const { min, max } = getMoraleMinMax(manager);

  return yield* put({
    type: "TEAM_INCREMENT_MORALE" as const,
    payload: {
      team: teamId,
      amount,
      min,
      max
    }
  });
}

export function* setReadiness(teamId: number, readiness: number) {
  return yield* put({
    type: "TEAM_SET_READINESS" as const,
    payload: {
      team: teamId,
      readiness
    }
  });
}

export function* incrementReadiness(teamId: number, amount: number) {
  return yield* put({
    type: "TEAM_INCREMENT_READINESS" as const,
    payload: {
      team: teamId,
      amount
    }
  });
}

export function* addEffect(
  team: number,
  parameter: string[],
  amount: number | string,
  duration: number,
  extra?: Record<string, unknown>
) {
  yield* put({
    type: "TEAM_ADD_EFFECT" as const,
    payload: {
      team,
      effect: {
        amount,
        duration,
        parameter,
        extra
      }
    }
  });
}

export function* addOpponentEffect(
  team: number,
  parameter: string[],
  amount: number | string,
  duration: number
) {
  yield* put({
    type: "TEAM_ADD_OPPONENT_EFFECT" as const,
    payload: {
      team,
      effect: {
        amount,
        duration,
        parameter
      }
    }
  });
}

export function* decrementReadiness(team: number, amount: number) {
  return yield* call(incrementReadiness, team, -amount);
}

export function* incrementStrength(teamId: number, amount: number) {
  return yield* put({
    type: "TEAM_INCREMENT_STRENGTH" as const,
    payload: {
      team: teamId,
      amount
    }
  });
}

export function* decrementStrength(team: number, amount: number) {
  return yield* call(incrementStrength, team, -amount);
}

export function* decrementMorale(team: number, amount: number) {
  return yield* call(incrementMorale, team, -amount);
}
