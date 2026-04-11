import competitionData from "../data/competitions";
import {
  seasonStart as seasonStartAction,
  gameBegin,
  clearExpired,
  competitionStart as competitionStartAction,
  gameGroupEnd,
  teamSetStrengths,
  setGameFlag,
  setServiceBasePrice,
  setGamePhase,
  competitionSeed,
  competitionRemoveTeam,
  competitionAddTeam,
  competitionSetTeams,
  nextTurn as nextTurnAction
} from "../ducks/game";
import { clearAnnouncements } from "../ducks/news";
import { clearEvents } from "../ducks/event";

import teamData from "../data/teams";

import { all, call, put, select, takeEvery, fork } from "typed-redux-saga";

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
import type { CompetitionId, Group, TeamStat } from "../types/competitions";
import { competitionSagas } from "@/data/competition-sagas";
import { entries } from "remeda";

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
  yield* takeEvery(gameBegin, beforeGame);
  yield* fork(stats);

  do {
    const turn = yield* select((state: RootState) => state.game.turn);

    const roundData = calendar[turn.round];

    const phases = roundData.phases;

    console.log("HAHAH");

    if (phases.includes("action")) {
      yield* call(actionPhase);
    }

    console.log("HAHAH 2");

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

    yield* put(clearExpired());

    yield* call(nextTurn);
  } while (true);
}

function* competitionStart(competitionId: CompetitionId) {
  const competitionStarter = competitionSagas[competitionId].start;
  if (competitionStarter) {
    yield* call(competitionStarter);
  }
  yield* put(
    competitionStartAction({
      competition: competitionId
    })
  );
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
  yield* put(teamSetStrengths(reStrengths));

  // Start all competitions.
  for (const [key] of entries(competitionData)) {
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

  yield* put(seasonStartAction());
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

export function* seedCompetition(competitionId: CompetitionId, phase: number) {
  const competitions = yield* select(
    (state: RootState) => state.game.competitions
  );
  const competitionObj = competitionData[competitionId];

  const empty = () => [() => {}, undefined] as const;

  const contextSagaGetter =
    competitionSagas[competitionId]?.seedContext?.[phase] || empty;

  const [callback, context] = yield* call(contextSagaGetter);

  const seeder = competitionObj.seed[phase];

  const seed = yield* call(seeder, competitions, context);

  yield* call(callback, seed);

  yield* put(
    competitionSeed({
      competition: competitionId,
      phase,
      seed
    })
  );
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
