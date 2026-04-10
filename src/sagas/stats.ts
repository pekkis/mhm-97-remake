import {
  all,
  select,
  putResolve,
  call,
  put,
  takeEvery
} from "typed-redux-saga";
import competitionTypes from "../services/competition-type";
import { resultFacts } from "../services/game";

import { STATS_UPDATE_FROM_FACTS, STATS_SET_SEASON_STAT } from "../ducks/stats";
import { managersMainCompetition } from "../data/selectors";
import type { RootState } from "../config/redux";
import type { Phase } from "../types/competitions";

export function* stats() {
  yield* all([
    takeEvery("COMPETITION_SEED" as any, calculatePhaseStats),
    takeEvery("GAME_GAME_RESULT" as any, gameResult)
  ]);
}

export function* calculatePhaseStats(action: {
  payload: { competition: string; phase: number };
}) {
  const { payload } = action;
  const phase: Phase = yield* select(
    (state: RootState) =>
      state.game.competitions[payload.competition].phases[payload.phase]
  );

  yield* all(
    phase.groups.map((group, groupId) =>
      call(groupStats, payload.competition, payload.phase, groupId)
    )
  );
}

function* groupStats(competitionId: string, phaseId: number, groupId: number) {
  const group = yield* select(
    (state: RootState) =>
      state.game.competitions[competitionId].phases[phaseId].groups[groupId]
  );

  const stats = yield* call(competitionTypes[group.type].stats, group);

  yield* putResolve({
    type: "COMPETITION_UPDATE_STATS" as const,
    payload: {
      competition: competitionId,
      phase: phaseId,
      group: groupId,
      stats
    }
  });
}

export function* calculateGroupStats(
  competition: string,
  phase: number,
  group: number
) {
  yield* call(groupStats, competition, phase, group);
}

function* gameResult(action: {
  payload: {
    competition: string;
    phase: number;
    meta: Record<string, { team: number; manager?: string }>;
    result: { home: number; away: number; overtime: boolean };
  };
}) {
  const {
    payload: { competition, phase, meta, result }
  } = action;

  const streaksToUpdate = (["home", "away"] as const).map((which) => {
    const team = meta[which].team;
    const manager = meta[which].manager;
    const facts = resultFacts(result, which);

    return put({
      type: STATS_UPDATE_FROM_FACTS,
      payload: {
        team: team.toString(),
        competition,
        phase: phase.toString(),
        manager,
        facts
      }
    });
  });

  yield* all(streaksToUpdate);
}

export function* setSeasonStat(path: string[], value: unknown) {
  yield* put({
    type: STATS_SET_SEASON_STAT,
    payload: {
      path,
      value
    }
  });
}

export function* createSeasonStories() {
  const managers = yield* select((state: RootState) => state.manager.managers);

  const stats = yield* select((state: RootState) => state.stats.currentSeason!);

  for (const [managerId, manager] of Object.entries(managers)) {
    const teamId = manager.team;

    const mainCompetition = yield* select(managersMainCompetition(managerId));

    const competition = yield* select(
      (state: RootState) => state.game.competitions[mainCompetition]
    );

    const group = yield* select(
      (state: RootState) =>
        state.game.competitions[mainCompetition].phases[0].groups[0]
    );

    const ranking = group.stats.findIndex((s: any) => s.id === teamId);
    const stat = group.stats[ranking];

    const story = {
      mainCompetition,
      mainCompetitionStat: stat,
      ranking,
      promoted: teamId === stats.promoted,
      relegated: teamId === stats.relegated,
      medal: stats.medalists!.findIndex((m) => m === teamId),
      ehlChampion: stats.ehlChampion === teamId,
      lastPhase: competition.phases.findLastIndex((phase: Phase) =>
        phase.teams.includes(teamId!)
      )
    };

    yield* call(setSeasonStat, ["stories", managerId], story);
  }
}
