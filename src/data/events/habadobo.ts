import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { addEffect } from "../../sagas/team";
import { randomTeamFrom, randomManager } from "../selectors";
import { cinteger } from "../../services/random";
import type { MHMEvent } from "../../types/base";

/*
sat57:
y = CINT(14 * RND) + 1
yyy = CINT(14 * RND) + 1
IF y = yyy THEN GOTO sat57
x = CINT(11 * RND) + 1
xx = CINT(6 * RND) + 6
IF sarja = 1 AND x = u THEN GOTO sat57
IF ass(x) > 0 THEN GOTO sat57
PRINT "Liigasta:"
PRINT "Managerivelho "; lm(y); ":n HabaDobo-systeemi on osoittautunut"
PRINT "suureksi flopiksi! "; l(x); " :n pelaajat eiv„t pysty noudattamaan"
PRINT "k„sitt„m„tt"mi„ kuvioita. "; lm(y); " saa potkut,tilalle tulee"
PRINT lm(yyy); " jolla on kova teht„v„ saada joukkue jaloilleen."
ass(x) = xx
talg(x) = -40
RETURN
*/

const eventId = "habadobo";

type HabadoboData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  duration: number;
  team: number;
  teamName: string;
  managerName: string;
  newManagerName: string;
};

const event: MHMEvent<HabadoboData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(randomTeamFrom(["phl"], false, []));
    const duration = cinteger(0, 6) + 6;
    const random = yield* select(randomManager());
    const random2 = yield* select(randomManager([random.get("id")]));

    yield* call(addEvent, {
      eventId,
      manager,
      duration,
      team: team.id,
      teamName: team.name,
      managerName: random.get("name"),
      newManagerName: random2.get("name"),
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `Liigasta:

Managerivelho ${data.managerName}:n _HabaDobo-systeemi_ on osoittautunut suureksi flopiksi! __${data.teamName}__:n pelaajat eivät pysty noudattamaan käsittämättömiä kuvioita.

${data.managerName} saa potkut. Tilalle tulee ${data.newManagerName}, jolla on kova työ saada joukkue jaloilleen.`
    ];
  },

  process: function* (data) {
    const team = data.team;
    const duration = data.duration;
    yield* call(addEffect, team, ["strength"], -40, duration);
  }
};

export default event;
