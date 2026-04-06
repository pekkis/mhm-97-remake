import competitionData from "../data/competitions";
import gameService from "../services/game";
import competitionTypes from "../services/competition-type";

import { call, put, putResolve, select, take } from "redux-saga/effects";
import { groupEnd } from "./game";
import { calculateGroupStats } from "./stats";
import { afterGameday } from "./manager";
import { bettingResults } from "./betting";

function* playGame(
  group,
  pairing,
  gameParams,
  overtime,
  competitionId,
  phaseId
) {
  const teams = yield select((state) => state.game.teams);

  const home = teams[group.teams[pairing.home]];
  const away = teams[group.teams[pairing.away]];

  const homeManager = yield select((state) =>
    state.manager.getIn(["managers", home.manager])
  );
  const awayManager = yield select((state) =>
    state.manager.getIn(["managers", away.manager])
  );

  const game = {
    ...gameParams,
    overtime,
    home,
    away,
    homeManager,
    awayManager,
    phaseId,
    competitionId
  };

  const result = yield call(gameService.simulate, game);

  return [
    result,
    {
      home: {
        manager: homeManager && homeManager.get("id"),
        team: home.id
      },
      away: {
        manager: awayManager && awayManager.get("id"),
        team: away.id
      }
    }
  ];
}

function* completeGameday(competition, phase, group, round) {
  yield call(calculateGroupStats, competition, phase, group);
  yield call(afterGameday, competition, phase, group, round);

  if (competition === "phl" && phase === 0 && group === 0) {
    yield call(bettingResults, round);
  }

  yield putResolve({
    type: "GAME_GAMEDAY_COMPLETE",
    payload: {
      competition,
      phase,
      group,
      round
    }
  });
}

export function* gameday(payload) {
  const competition = yield select((state) => state.game.competitions[payload]);

  const phase = competition.phases[competition.phase];

  const overtime = competitionTypes[phase.type].overtime;
  const playMatch = competitionTypes[phase.type].playMatch;

  // Play one round if not a tournament, otherwise loop all rounds.
  const rounds =
    phase.type === "tournament" ? phase.groups[0].schedule.length : 1;

  for (
    let roundNumber = 1;
    roundNumber <= rounds;
    roundNumber = roundNumber + 1
  ) {
    for (const [groupIndex, group] of phase.groups.entries()) {
      const gameParams = competitionData[competition.id].parameters.gameday(
        competition.phase,
        groupIndex
      );

      const round = yield select(
        (state) =>
          state.game.competitions[payload].phases[competition.phase].groups[
            groupIndex
          ].round
      );
      const pairings = group.schedule[round];
      for (let x = 0; x < pairings.length; x = x + 1) {
        if (playMatch(group, round, x)) {
          const pairing = pairings[x];

          yield put({
            type: "GAME_GAME_BEGIN",
            payload: {
              competition: competition.id,
              phase: competition.phase,
              group: groupIndex,
              round,
              pairing: x
            }
          });

          const [result, meta] = yield call(
            playGame,
            group,
            pairing,
            gameParams,
            overtime,
            competition.id,
            phase.type
          );

          yield put({
            type: "GAME_GAME_RESULT",
            payload: {
              competition: competition.id,
              phase: competition.phase,
              group: groupIndex,
              round,
              result: result,
              pairing: x,
              meta
            }
          });
        }
      }
      yield completeGameday(
        competition.id,
        competition.phase,
        groupIndex,
        round
      );
    }

    if (phase.type === "tournament") {
      if (roundNumber < rounds) {
        yield put({
          type: "GAME_SET_PHASE",
          payload: "results"
        });

        yield take("GAME_ADVANCE_REQUEST");

        yield put({
          type: "GAME_SET_PHASE",
          payload: "gameday"
        });

        yield take("GAME_ADVANCE_REQUEST");
      }
    }
  }

  for (const [groupIndex] of phase.groups.entries()) {
    const theGroup = yield select(
      (state) =>
        state.game.competitions[payload].phases[competition.phase].groups[
          groupIndex
        ]
    );

    const isItOver = theGroup.schedule.length === theGroup.round;
    if (isItOver) {
      yield call(groupEnd, payload, competition.phase, groupIndex);
    }
  }
}
