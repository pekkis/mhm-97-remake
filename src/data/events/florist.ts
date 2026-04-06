import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { decrementStrength } from "../../sagas/team";
import { randomTeamFrom } from "../selectors";
import type { MHMEvent } from "../../types/base";

/*
sat66:
xxx = CINT(11 * RND) + 1
IF xxx = u AND sarja = 1 THEN GOTO sat66
PRINT "Liigasta:"
PRINT l(xxx); " on kokenut suuren menetyksen! Heid„n lupaava, nuori"
PRINT "sentterins„ lopettaa j„„kiekkouransa floristi-opintojensa takia!"
v(xxx) = v(xxx) - 13
RETURN
*/

const eventId = "florist";

type FloristData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  team: number;
  teamName: string;
};

const event: MHMEvent<FloristData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(randomTeamFrom(["phl"], false, []));

    yield* call(addEvent, {
      eventId,
      manager,
      team: team.get("id"),
      teamName: team.get("name"),
      resolved: true,
    });
    return;
  },

  render: (data) => {
    return [
      `Liigasta:

__${data.teamName}__ on kokenut suuren menetyksen! Heidän lupaava, nuori sentterinsä lopettaa jääkiekkouransa floristi-opintojen takia!`,
    ];
  },

  process: function* (data) {
    const team = data.team;
    yield* call(decrementStrength, team, 13);
  },
};

export default event;
