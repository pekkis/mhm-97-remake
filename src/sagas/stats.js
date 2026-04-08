import {
  takeEvery,
  all,
  select,
  putResolve,
  call,
  put
} from "redux-saga/effects";
import competitionTypes from "../services/competition-type";
import { resultFacts } from "../services/game";

import { STATS_UPDATE_FROM_FACTS, STATS_SET_SEASON_STAT } from "../ducks/stats";
import { managersMainCompetition } from "../data/selectors";

export function* stats() {
  yield all([
    // TODO: TAKE THIS OUT OF HERE
    takeEvery("COMPETITION_SEED", calculatePhaseStats),
    takeEvery("GAME_GAME_RESULT", gameResult)
  ]);
}

export function* calculatePhaseStats(action) {
  const { payload } = action;
  const phase = yield select(
    (state) =>
      state.game.competitions[payload.competition].phases[payload.phase]
  );

  yield all(
    phase.groups.map((group, groupId) =>
      call(groupStats, payload.competition, payload.phase, groupId)
    )
  );
}

function* groupStats(competitionId, phaseId, groupId) {
  const group = yield select(
    (state) =>
      state.game.competitions[competitionId].phases[phaseId].groups[groupId]
  );

  const stats = yield call(competitionTypes[group.type].stats, group);

  yield putResolve({
    type: "COMPETITION_UPDATE_STATS",
    payload: {
      competition: competitionId,
      phase: phaseId,
      group: groupId,
      stats
    }
  });
}

export function* calculateGroupStats(competition, phase, group) {
  yield call(groupStats, competition, phase, group);
}

function* gameResult(action) {
  const {
    payload: { competition, phase, meta, result }
  } = action;

  const streaksToUpdate = ["home", "away"].map((which) => {
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

  yield all(streaksToUpdate);
}

export function* setSeasonStat(path, value) {
  yield put({
    type: STATS_SET_SEASON_STAT,
    payload: {
      path,
      value
    }
  });
}

export function* createSeasonStories() {
  const managers = yield select((state) => state.manager.managers);

  const stats = yield select((state) => state.stats.get("currentSeason"));

  for (const [managerId, manager] of Object.entries(managers)) {
    const teamId = manager.team;

    const mainCompetition = yield select(managersMainCompetition(managerId));

    const competition = yield select(
      (state) => state.game.competitions[mainCompetition]
    );

    const group = yield select(
      (state) => state.game.competitions[mainCompetition].phases[0].groups[0]
    );

    const ranking = group.stats.findIndex((s) => s.id === teamId);
    const stat = group.stats[ranking];

    const story = {
      mainCompetition,
      mainCompetitionStat: stat,
      ranking,
      promoted: teamId === stats.get("promoted"),
      relegated: teamId === stats.get("relegated"),
      medal: stats.get("medalists").findIndex((m) => m === teamId),
      ehlChampion: stats.get("ehlChampionship") === teamId,
      lastPhase: competition.phases.findLastIndex((phase) =>
        phase.teams.includes(teamId)
      )
    };

    yield call(setSeasonStat, ["stories", managerId], story);
  }
}
