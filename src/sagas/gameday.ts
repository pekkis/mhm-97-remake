import competitionData from "@/data/competitions";
import { simulate, type GameInput } from "@/services/game";
import competitionTypes from "@/services/competition-type";

import { call, put, select, take } from "typed-redux-saga";
import { groupEnd } from "./game";
import { calculateGroupStats } from "./stats";
import { afterGameday } from "./manager";
import { bettingResults } from "./betting";
import {
  advance,
  gameBegin,
  gameResult as gameResultAction,
  gamedayComplete,
  setGamePhase
} from "@/ducks/game";
import type { RootState } from "@/config/redux";
import type {
  Competition,
  CompetitionId,
  GameResult,
  GamedayParams,
  Group,
  Pairing
} from "@/types/competitions";

function* playGame(
  group: Group,
  pairing: Pairing,
  gameParams: GamedayParams,
  overtime: (result: GameResult) => boolean,
  competitionId: string,
  phaseId: number
) {
  const teams = yield* select((state: RootState) => state.game.teams);

  const home = teams[group.teams[pairing.home]];
  const away = teams[group.teams[pairing.away]];

  const homeManager = yield* select(
    (state: RootState) => state.manager.managers[home.manager!]
  );
  const awayManager = yield* select(
    (state: RootState) => state.manager.managers[away.manager!]
  );

  const game: GameInput = {
    ...gameParams,
    overtime,
    home,
    away,
    homeManager,
    awayManager,
    phaseId,
    competitionId
  };

  const result: GameResult = yield* call(simulate, game);

  return [
    result,
    {
      home: {
        manager: homeManager && homeManager.id,
        team: home.id
      },
      away: {
        manager: awayManager && awayManager.id,
        team: away.id
      }
    }
  ] as const;
}

function* completeGameday(
  competition: CompetitionId,
  phase: number,
  group: number,
  round: number
) {
  yield* call(calculateGroupStats, competition, phase, group);
  yield* call(afterGameday, competition, phase, group, round);

  if (competition === "phl" && phase === 0 && group === 0) {
    yield* call(bettingResults, round);
  }

  yield* put(
    gamedayComplete({
      competition,
      phase,
      group,
      round
    })
  );
}

export function* gameday(payload: CompetitionId) {
  const competition: Competition = yield* select(
    (state: RootState) => state.game.competitions[payload]
  );

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

      const round: number = yield* select(
        (state: RootState) =>
          state.game.competitions[payload].phases[competition.phase].groups[
            groupIndex
          ].round
      );
      const pairings = group.schedule[round];
      for (let x = 0; x < pairings.length; x = x + 1) {
        if (playMatch(group, round, x)) {
          const pairing = pairings[x];

          yield* put(
            gameBegin({
              competition: competition.id,
              phase: competition.phase,
              group: groupIndex,
              round,
              pairing: x
            })
          );

          const [result, meta] = yield* call(
            playGame,
            group,
            pairing,
            gameParams,
            overtime,
            competition.id,
            competition.phase
          );

          yield* put(
            gameResultAction({
              competition: competition.id,
              phase: competition.phase,
              group: groupIndex,
              round,
              result: result,
              pairing: x,
              meta
            })
          );
        }
      }
      yield* call(
        completeGameday,
        competition.id,
        competition.phase,
        groupIndex,
        round
      );
    }

    if (phase.type === "tournament") {
      if (roundNumber < rounds) {
        yield* put(setGamePhase("results"));

        yield* take(advance);

        yield* put(setGamePhase("gameday"));

        yield* take(advance);
      }
    }
  }

  for (const [groupIndex] of phase.groups.entries()) {
    const theGroup = yield* select(
      (state: RootState) =>
        state.game.competitions[payload].phases[competition.phase].groups[
          groupIndex
        ]
    );

    const isItOver = theGroup.schedule.length === theGroup.round;
    if (isItOver) {
      yield* call(groupEnd, payload, competition.phase, groupIndex);
    }
  }
}
