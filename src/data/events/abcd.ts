import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { addEffect } from "../../sagas/team";
import { randomTeamFrom, randomManager, teamsStrength } from "../selectors";
import { cinteger } from "../../services/random";
import type { MHMEvent } from "../../types/base";

const eventId = "abcd";

/*
y = CINT(14 * RND) + 1
x = CINT(11 * RND) + 1
xx = CINT(6 * RND) + 3
IF sarja = 1 AND x = u THEN GOTO sat50
IF ass(x) > 0 THEN GOTO sat50
PRINT "Liigasta:"
PRINT "Managerivelho "; lm(y); " on saanut psyykattua "; l(x); ":n"
PRINT "k„sitt„m„tt"m„„n vireeseen! H„nen ns. 'ABCD'- ohjelmansa puree!"
ass(x) = xx
talg(x) = CINT(v(x) / 4)
*/

type AbcdData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  duration: number;
  team: number;
  teamName: string;
  managerName: string;
};

const event: MHMEvent<AbcdData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(randomTeamFrom(["phl"]));
    const duration = cinteger(0, 6) + 3;
    const random = yield* select(randomManager());

    yield* call(addEvent, {
      eventId,
      manager,
      duration,
      team: team.get("id"),
      teamName: team.get("name"),
      managerName: random.get("name"),
      resolved: true,
    });
    return;
  },

  render: (data) => {
    return [
      `Liigasta:

Managerivelho ${data.managerName} on saanut psyykattua ${data.teamName}:n käsittämättömään vireeseen! Hänen nk. "ABCD-ohjelmansa" puree!`,
    ];
  },

  process: function* (data) {
    const team = data.team;
    const duration = data.duration;

    const strength = yield* select(teamsStrength(team));

    yield* call(
      addEffect,
      team,
      ["strength"],
      Math.round(strength / 4),
      duration,
    );
  },
};

export default event;
