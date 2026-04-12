import { call } from "typed-redux-saga";
import { select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { addEffect } from "@/sagas/team";
import { randomTeamFrom, randomManager } from "@/selectors";
import type { MHMEvent } from "@/types/base";

/*
sat60:
x = CINT(11 * RND) + 1
xx = 5
IF sarja = 1 AND x = u THEN GOTO sat60
IF ass(x) > 0 THEN GOTO sat60
PRINT "Liigasta:"
PRINT lm(x); " valmentaa joukkuetta "; l(x); ". SINŽ kytt„„t lehtien mukaan h„nen paikkaansa,"
PRINT "ja "; l(x); ":n pakka menee t„ydellisesti sekaisin!"
ass(x) = xx
talg(x) = -15
RETURN*/

const eventId = "youStalk";

type YouStalkData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  duration: number;
  team: number;
  teamName: string;
  managerName: string;
};

const event: MHMEvent<YouStalkData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(randomTeamFrom(["phl"], false, []));
    const duration = 5;
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
  },

  render: (data) => {
    return [
      `Liigasta:

__${data.managerName}__ valmentaa joukkuetta __${data.teamName}__. Sinä kyttäät lehtien mukaan hänen paikkaansa, ja joukkue-paran pakka menee hetkeksi hiukan sekaisin!`
    ];
  },

  process: function* (data) {
    yield* call(addEffect, data.team, ["strength"], -15, data.duration);
  }
};

export default event;
