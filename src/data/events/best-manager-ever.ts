import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { incrementMorale } from "../../sagas/team";
import { randomManager, managersTeamId } from "../selectors";
import type { MHMEvent } from "../../types/base";

/*
sat64:
xxx = CINT(14 * RND) + 1
PRINT "Ilta-Maso rankkaa sinut kaikkien aikojen parhaaksi manageriksi!"
PRINT "Listan h„nnilt„ l"ytyy "; lm(xxx)
RETURN
*/

const eventId = "bestManagerEver";

type BestManagerEverData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  otherManager: string;
};

const event: MHMEvent<BestManagerEverData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const random = yield* select(randomManager());

    yield* call(addEvent, {
      eventId,
      manager,
      otherManager: random.name,
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `__Ilta-Maso__ rankkaa sinut _kaikkien aikojen parhaaksi_ manageriksi! Listan hänniltä löytyy ${data.otherManager}.`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    yield* call(incrementMorale, team, 1);
  }
};

export default event;
