import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { addEffect } from "@/sagas/team";
import { randomTeamOrNullFrom, randomManager } from "@/selectors";
import type { MHMEvent } from "@/types/base";
import type { Team } from "@/state/game";

/*
xx = 1000
IF cccp = 20 THEN RETURN
cc = CINT(11 * RND) + 1
ccc = CINT(14 * RND) + 1
IF cc = u AND sarja = 1 THEN cccp = cccp + 1: GOTO sat94
IF v(cc) > 200 THEN cccp = cccp + 1: GOTO sat94
IF ass(cc) > 0 THEN cccp = cccp + 1: GOTO sat94
PRINT "Kovin nimet"n "; l(cc); "on saanut uskomattoman fiiliksen p„„lle!"
PRINT "Kaikki pelaavat vain joukkueen menestyksen eteen, ja manageri"
PRINT lm(ccc); " lupaa pelaajiensa jaksavan koko pitk„n kauden loppuun!"
ass(cc) = xx
talg(cc) = 50
*/

const eventId = "incredibleFeeling";

type IncredibleFeelingData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  duration: number;
  team: number;
  teamName: string;
  managerName: string;
};

const event: MHMEvent<IncredibleFeelingData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(
      randomTeamOrNullFrom(["phl"], false, [], (t: Team) => t.strength < 200)
    );
    if (!team) {
      return;
    }

    const duration = 1000;
    const random = yield* select(randomManager());

    yield* call(addEvent, {
      eventId,
      manager,
      duration,
      team: team.id,
      teamName: team.name,
      managerName: random.name,
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `Kovin nimetön __${data.teamName}__ on saanut uskomattoman fiiliksen päälle! Kaikki pelaavat vain joukkueen menestyksen eteen, ja manageri __${data.managerName}__ lupaa pelaajiensa jaksavan koko pitkän kauden loppuun!`
    ];
  },

  process: function* (data) {
    const team = data.team;
    const duration = data.duration;
    yield* call(addEffect, team, ["strength"], 50, duration);
  }
};

export default event;
