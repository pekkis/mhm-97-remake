import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { addEffect } from "../../sagas/team";
import { randomTeamFrom } from "../selectors";
import { cinteger } from "../../services/random";
import type { MHMEvent } from "../../types/base";

const eventId = "ogilny";

type OgilnyData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  duration: number;
  team: number;
  teamName: string;
};

const event: MHMEvent<OgilnyData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(randomTeamFrom(["phl"]));
    const duration = cinteger(0, 2) + 1;

    yield* call(addEvent, {
      eventId,
      manager,
      duration,
      team: team.get("id"),
      teamName: team.get("name"),
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `Liigasta:

Auts! ${data.teamName}:n liukas venäläishyökkääjä Malexander Ogilny loukkaa nivusensa kun viuhuva lämäri kolahtaa sopivasti oikeaan paikkaan. Mies on poissa ${data.duration} viikkoa.`
    ];
  },

  process: function* (data) {
    const team = data.team;
    const duration = data.duration;

    yield* call(addEffect, team, ["strength"], -15, duration);
  }
};

/*
sat49:
x = CINT(11 * RND) + 1
xx = CINT(2 * RND) + 1
IF sarja = 1 AND x = u THEN GOTO sat49
IF ass(x) > 0 THEN GOTO sat49
PRINT "Liigasta:"
PRINT "Auts! "; l(x); ":n liukas ven„l„ishy"kk„„j„ Malexander Ogilny loukkaa"
PRINT "nivusensa kun viuhuva l„m„ri kolahtaa sopivasti oikeaan paikkaan."
PRINT "Mies on poissa "; xx; " viikkoa."
ass(x) = xx
talg(x) = -15
RETURN
*/

export default event;
