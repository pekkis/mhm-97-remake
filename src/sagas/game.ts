import competitionData from "../data/competitions";
import { SEASON_START } from "../ducks/game";

import teamData from "../data/teams";

import {
  all,
  call,
  put,
  putResolve,
  select,
  takeEvery,
  fork
} from "typed-redux-saga";

import actionPhase from "./phase/action";
import eventCreationPhase from "./phase/event-creation";
import eventPhase from "./phase/event";
import newsPhase from "./phase/news";
import prankPhase from "./phase/prank";
import gamedayPhase from "./phase/gameday";
import invitationsCreatePhase from "./phase/invitations-create";
import invitationsProcessPhase from "./phase/invitations-process";
import seedPhase from "./phase/seed";
import endOfSeasonPhase from "./phase/end-of-season";
import startOfSeasonPhase from "./phase/start-of-season";
import galaPhase from "./phase/gala";

import calculationsPhase from "./phase/calculations";
import calendar from "../data/calendar";
import difficultyLevels from "../data/difficulty-levels";

import { setExtra, decrementBalance, incrementInsuranceExtra } from "./manager";
import { stats } from "./stats";
import {
  allTeams,
  managersTeam,
  managersDifficulty,
  managersMainCompetition,
  managerHasService,
  managersArena
} from "../data/selectors";
import events from "../data/events";
import type { RootState } from "../config/redux";
import type {
  Competition,
  CompetitionDefinition,
  Group,
  TeamStat
} from "../types/competitions";

export const GAME_ADVANCE_REQUEST = "GAME_ADVANCE_REQUEST";

export function* beforeGame(action: any) {
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

    const event = events["topGame"];

    for (const manager of humansInGame) {
      yield* call(event.create, {
        manager
      });
    }
  }

  return;
}

export function* gameLoop() {
  yield* takeEvery("GAME_GAME_BEGIN" as any, beforeGame);
  yield* fork(stats);

  do {
    const turn = yield* select((state: RootState) => state.game.turn);

    const roundData = calendar[turn.round];

    const phases = roundData.phases;

    if (phases.includes("action")) {
      yield* call(actionPhase);
    }

    if (phases.includes("prank")) {
      yield* call(prankPhase);
    }

    if (phases.includes("gameday")) {
      yield* call(gamedayPhase);
    }

    if (phases.includes("calculations")) {
      yield* call(calculationsPhase);
    }

    if (phases.includes("eventCreation")) {
      yield* call(eventCreationPhase);
    }

    if (phases.includes("event")) {
      yield* call(eventPhase);
    }

    if (phases.includes("news")) {
      yield* call(newsPhase);
    }

    if (phases.includes("invitations-create")) {
      yield* call(invitationsCreatePhase);
    }

    if (phases.includes("invitations-process")) {
      yield* call(invitationsProcessPhase);
    }

    if (phases.includes("startOfSeason")) {
      yield* call(startOfSeasonPhase);
    }

    if (phases.includes("seed")) {
      yield* call(seedPhase);
    }

    if (phases.includes("gala")) {
      yield* call(galaPhase);
    }

    if (phases.includes("endOfSeason")) {
      yield* call(endOfSeasonPhase);
    }

    yield* putResolve({ type: "GAME_CLEAR_EXPIRED" as const });

    yield* call(nextTurn);
  } while (true);
}

function* competitionStart(competitionId: string) {
  const competitionStarter = competitionData[competitionId].start;
  if (competitionStarter) {
    yield* call(competitionStarter);
  }
  yield* put({
    type: "COMPETITION_START" as const,
    payload: {
      competition: competitionId
    }
  });
}

export function* groupEnd(competition: string, phase: number, group: number) {
  const groupEnder = competitionData[competition].groupEnd;

  if (groupEnder) {
    yield* call(groupEnder, phase, group);
  }

  yield* put({
    type: "GAME_GROUP_END" as const,
    payload: {
      competition,
      phase,
      group
    }
  });
}

export function* seasonStart() {
  const turn = yield* select((state: RootState) => state.game.turn);
  const season = turn.season;

  const teams = yield* select(allTeams);

  // Re-strength European teams.
  const reStrengths = teams.slice(24).map((t) => {
    return {
      id: t.id,
      strength: teamData[t.id].strength()
    };
  });
  yield* put({
    type: "TEAM_SET_STRENGTHS" as const,
    payload: reStrengths
  });

  // Start all competitions.
  for (const [key] of Object.entries(competitionData)) {
    yield* call(competitionStart, key);
  }

  const managers = yield* select((state: RootState) => state.manager.managers);
  for (const [, manager] of Object.entries(managers)) {
    console.log("MANAGER", manager);

    // Skip the first season for salary payments.
    if (season > 0) {
      const managerId = manager.id;
      const team = yield* select(managersTeam(managerId));
      const difficulty = yield* select(managersDifficulty(managerId));
      const mainCompetition = yield* select(managersMainCompetition(managerId));
      const salaryPerStrength =
        difficultyLevels[difficulty].salary(mainCompetition);
      const totalSalary = salaryPerStrength * team.strength;
      yield* call(decrementBalance, managerId, totalSalary);

      const hasInsurance = yield* select(
        managerHasService(managerId, "insurance")
      );

      if (hasInsurance) {
        const arena = yield* select(managersArena(managerId));
        yield* call(incrementInsuranceExtra, managerId, -50 * arena!.level);
      }
    }

    // Reset extra each season.
    yield* call(
      setExtra,
      manager.id,
      difficultyLevels[manager.difficulty].extra
    );
  }

  yield* put({
    type: SEASON_START
  });
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
  yield* put({
    type: "GAME_SET_FLAG" as const,
    payload: {
      flag,
      value
    }
  });
}

export function* incrementServiceBasePrice(service: string, amount: number) {
  const currentAmount = yield* select(
    (state: RootState) => state.game.serviceBasePrices[service]
  );

  yield* put({
    type: "GAME_SET_SERVICE_BASE_PRICE" as const,
    payload: {
      service,
      amount: currentAmount + amount
    }
  });
}

function* nextTurn() {
  yield* put({ type: "NEWS_ANNOUNCEMENTS_CLEAR" as const });
  yield* put({ type: "EVENT_CLEAR_EVENTS" as const });
  yield* put({ type: "GAME_NEXT_TURN" as const });
}

export function* setPhase(phase: string) {
  yield* put({
    type: "GAME_SET_PHASE" as const,
    payload: phase
  });
}

export function* seedCompetition(competitionId: string, phase: number) {
  const competitions = yield* select(
    (state: RootState) => state.game.competitions
  );
  const competitionObj = competitionData[competitionId];

  const seeder = competitionObj.seed[phase];

  const seed = yield* call(seeder, competitions);

  yield* putResolve({
    type: "COMPETITION_SEED" as const,
    payload: {
      competition: competitionId,
      phase,
      seed
    }
  });
}

export function* removeTeamFromCompetition(competition: string, team: number) {
  yield* putResolve({
    type: "COMPETITION_REMOVE_TEAM" as const,
    payload: {
      competition,
      team
    }
  });
}

export function* addTeamToCompetition(competition: string, team: number) {
  yield* putResolve({
    type: "COMPETITION_ADD_TEAM" as const,
    payload: {
      competition,
      team
    }
  });
}

export function* setCompetitionTeams(competition: string, teams: number[]) {
  yield* putResolve({
    type: "COMPETITION_SET_TEAMS" as const,
    payload: {
      competition,
      teams
    }
  });
}
