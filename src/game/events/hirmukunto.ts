import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { addEffect } from "@/sagas/team";
import { randomTeamFrom, randomManager, teamsStrength } from "@/selectors";
import type { MHMEvent } from "@/types/base";

const eventId = "hirmukunto";

/*
sat51:
y = CINT(14 * RND) + 1
x = CINT(11 * RND) + 1
xx = 45 - kr
IF sarja = 2 AND x = u THEN GOTO sat51
IF ssa(x) > 0 THEN GOTO sat51
PRINT "Divisioonasta:"
PRINT ld(x); " on p„„tt„nyt manageriguru "; lm(y); ":n johdolla"
PRINT "nousta liigaan! He ovat hirmukunnossa!"
ssa(x) = xx
tadv(x) = vd(x) / 2
RETURN
*/

type HirmukuntoData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  duration: number;
  team: number;
  teamName: string;
  managerName: string;
};

const event: MHMEvent<HirmukuntoData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(randomTeamFrom(["division"]));
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
      `Divisioonasta:

__${data.teamName}__ on päättänyt manageriguru ${data.managerName}:n johdolla nousta liigaan! He ovat _hirmukunnossa!_`
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
      Math.round(strength / 2),
      duration
    );
  }
};

export default event;
