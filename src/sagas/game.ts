import competitionData from "@/data/competitions";
import {
  gameBegin,
  clearExpired,
  gameGroupEnd,
  setGameFlag,
  setServiceBasePrice,
  setGamePhase,
  competitionRemoveTeam,
  competitionAddTeam,
  competitionSetTeams,
  nextTurn as nextTurnAction
} from "@/ducks/game";
import { clearAnnouncements } from "@/ducks/news";
import { clearEvents } from "@/ducks/event";

import { all, call, put, select, takeEvery, fork } from "typed-redux-saga";

import actionPhase from "./phase/action";
import calculationsPhase from "./phase/calculations";
import newsPhase from "./phase/news";
import gamedayPhase from "./phase/gameday";
import endOfSeasonPhase from "./phase/end-of-season";
import galaPhase from "./phase/gala";
import calendar from "@/data/calendar";

import { stats } from "./stats";
import type { RootState } from "@/config/redux";
import type { CompetitionId, Group, TeamStat } from "@/types/competitions";
import { competitionSagas } from "./competition-registry";

export function* beforeGame(action: ReturnType<typeof gameBegin>) {
  const {
    payload: { competition, phase, group, round, pairing }
  } = action;

  if (competition === "phl" && phase === 0 && group === 0 && round >= 5) {
    const g: Group = yield* select(
      (state: RootState) =>
        state.game.competitions[competition].phases[phase].groups[group]
    );

    const teams = yield* select((state: RootState) => state.game.teams);

    const p = g.schedule[round][pairing];

    const t = [p.home, p.away]
      .map((idx) => g.teams[idx])
      .map((tid) => teams[tid]);

    const humansInGame = t
      .filter((t) => t.manager !== undefined)
      .map((t) => t.manager!);

    if (humansInGame.length === 0) {
      return;
    }

    const interestingTeams = (g.stats as TeamStat[])
      .slice(0, 5)
      .map((s) => s.id);

    const gameIsInteresting = t.every((t) => interestingTeams.includes(t.id));
    if (!gameIsInteresting) {
      return;
    }

    // topGame event creation lives on the machine side post-pivot.
  }

  return;
}

export function* gameLoop() {
  yield* takeEvery(gameBegin, beforeGame);
  yield* fork(stats);

  do {
    const turn = yield* select((state: RootState) => state.game.turn);

    const roundData = calendar[turn.round];

    const phases = roundData.phases;

    if (phases.includes("action")) {
      yield* call(actionPhase);
    }

    if (phases.includes("gameday")) {
      yield* call(gamedayPhase);
    }

    if (phases.includes("calculations")) {
      yield* call(calculationsPhase);
    }

    if (phases.includes("news")) {
      yield* call(newsPhase);
    }

    if (phases.includes("gala")) {
      yield* call(galaPhase);
    }

    if (phases.includes("end_of_season")) {
      yield* call(endOfSeasonPhase);
    }

    yield* put(clearExpired());

    yield* call(nextTurn);
  } while (true);
}

export function* groupEnd(
  competition: CompetitionId,
  phase: number,
  group: number
) {
  const groupEnder = competitionSagas[competition].groupEnd;

  if (groupEnder) {
    yield* call(groupEnder, phase, group);
  }

  yield* put(
    gameGroupEnd({
      competition,
      phase,
      group
    })
  );
}

export function* seasonStart() {
  // No-op. Season-start logic owned by `seasonStartSetup` in the game machine.
}

export function* promote(competition: string, team: number) {
  const promoteTo = competitionData[competition].promoteTo;
  yield* all([
    call(removeTeamFromCompetition, competition, team),
    call(addTeamToCompetition, promoteTo as string, team)
  ]);
}

export function* relegate(competition: string, team: number) {
  const relegateTo = competitionData[competition].relegateTo;

  yield* all([
    call(removeTeamFromCompetition, competition, team),
    call(addTeamToCompetition, relegateTo as string, team)
  ]);
}

export function* setFlag(flag: string, value: unknown) {
  yield* put(setGameFlag({ flag, value }));
}

export function* incrementServiceBasePrice(service: string, amount: number) {
  const currentAmount = yield* select(
    (state: RootState) => state.game.serviceBasePrices[service]
  );

  yield* put(
    setServiceBasePrice({
      service,
      amount: currentAmount + amount
    })
  );
}

function* nextTurn() {
  yield* put(clearAnnouncements());
  yield* put(clearEvents());
  yield* put(nextTurnAction());
}

export function* setPhase(phase: string) {
  yield* put(setGamePhase(phase));
}

export function* removeTeamFromCompetition(competition: string, team: number) {
  yield* put(
    competitionRemoveTeam({
      competition,
      team
    })
  );
}

export function* addTeamToCompetition(competition: string, team: number) {
  yield* put(
    competitionAddTeam({
      competition,
      team
    })
  );
}

export function* setCompetitionTeams(competition: string, teams: number[]) {
  yield* put(
    competitionSetTeams({
      competition,
      teams
    })
  );
}
