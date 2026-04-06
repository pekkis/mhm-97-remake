import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { addEffect } from "../../sagas/team";
import { randomManager, randomTeamFrom } from "../selectors";
import type { MHMEvent } from "../../types/base";

/*
sat71:
x = CINT(11 * RND) + 1
IF x = u AND sarja = 1 THEN GOTO sat71
PRINT l(x); " p„„see otsikoihin, kun joukkueessa pelaava Jatakar Onecky,"
PRINT "liigan suurin sika, yritt„„ potkaista vastustajaansa luistimella naamaan."
PRINT "Tuomari seisoo vieress„, mutta Oneckyn vaikutusvaltainen tukija, manageri X"
PRINT "hoitaa asian siten, ett„ Onecky selvi„„ ilman seuraamuksia."
RETURN
*/

const eventId = "onecky";

type OneckyData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  team: number;
  teamName: string;
  otherManager: string;
};

const event: MHMEvent<OneckyData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(randomTeamFrom(["phl"]));
    const random = yield* select(randomManager());

    yield* call(addEvent, {
      eventId,
      manager,
      team: team.get("id"),
      teamName: team.get("name"),
      otherManager: random.get("name"),
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `__${data.teamName}__ pääsee otsikoihin, kun joukkueessa pelaava __Jatakar Onecky__, liigan suurin sika, yrittää potkaista vastustajaansa luistimella naamaan.

Tuomari seisoo vieressä, mutta Oneckyn vaikutusvaltainen tukija, manageri ${data.otherManager}, hoitaa asian siten, että Onecky selviää ilman seuraamuksia."`
    ];
  },

  process: function* (data) {
    const team = data.team;
    yield* call(addEffect, team, ["morale"], -5, 3);
  }
};

export default event;
