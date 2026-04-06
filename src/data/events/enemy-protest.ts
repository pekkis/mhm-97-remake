import { select, call, all } from "typed-redux-saga";
import {
  managersTeam,
  managersDifficulty,
  randomManager,
  managerCompetesIn,
  randomTeamFrom
} from "../selectors";
import { addEvent } from "../../sagas/event";
import { incurPenalty } from "../../sagas/team";
import type { MHMEvent } from "../../types/base";

const eventId = "enemyProtest";

type EnemyProtestData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  otherManagerName: string;
  otherTeam: number;
  otherTeamName: string;
  penalty: number;
  reward: number;
  team: number;
};

const event: MHMEvent<EnemyProtestData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const difficultyLevel = yield* select(managersDifficulty(manager));
    const otherManager = yield* select(randomManager());

    const competesInPHL = yield* select(managerCompetesIn(manager, "phl"));
    const otherTeam = yield* select(
      randomTeamFrom([competesInPHL ? "phl" : "division"])
    );

    const penalty = difficultyLevel === 4 ? -4 : -2;
    const reward = 2;

    const team = yield* select(managersTeam(manager));

    yield* call(addEvent, {
      eventId,
      manager,
      otherManagerName: otherManager.get("name"),
      otherTeam: otherTeam.id,
      otherTeamName: otherTeam.name,
      penalty,
      reward,
      team: team.id,
      resolved: true
    });
  },

  render: (data) => {
    return [
      `Manageri __${data.otherManagerName}__ ja joukkueensa __${data.otherTeamName}__ tekevät protestin joukkuettasi vastaan.

Protesti menee läpi, ja teiltä vähennetään ${Math.abs(data.penalty)} pistettä. ${data.otherTeamName} saa ${Math.abs(data.reward)} lisäpistettä.`
    ];
  },

  process: function* (data) {
    const otherTeam = data.otherTeam;
    const penalty = data.penalty;
    const reward = data.reward;
    const team = data.team;

    const competitions = yield* select((state: any) =>
      state.game.competitions
    );

    const competition = competitions
      .filterNot((c: any) => c.get("id") === "ehl")
      .find((c: any) => c.get("teams").includes(team));

    const groupId = competition
      .getIn(["phases", 0, "groups"])
      .findIndex((g: any) => g.get("teams").includes(team));

    yield* all([
      call(incurPenalty, competition.get("id"), 0, groupId, team, penalty),
      call(incurPenalty, competition.get("id"), 0, groupId, otherTeam, reward)
    ]);
  }
};

/*
  sat37:
y = CINT(14 * RND) + 1
IF sarja = 1 THEN PRINT l(z); ":n manageri "; lm(y); " nostaa kanteen joukkuettasi vastaan."
IF sarja = 2 THEN PRINT ld(z); ":n manageri "; lm(y); " nostaa kanteen joukkuettasi vastaan."
PRINT "Protesti menee l„pi, ja teilt„ v„hennet„„n 2 pistett„!!"
IF sarja = 1 THEN PRINT l(z); " saa 2 lis„pistett„.":
IF sarja = 2 THEN PRINT ld(z); " saa 2 lis„pistett„."
IF vai = 5 THEN PRINT "J„„kiekkoliitto rankaisee lis„ksi 2 pisteen menetyksell„!"
IF vai = 5 THEN o = 4 ELSE o = 2
IF sarja = 1 THEN p(u) = p(u) - o: p(z) = p(z) + 2
*/

export default event;
