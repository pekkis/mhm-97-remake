import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { decrementMorale } from "@/sagas/team";
import { randomManager, managersTeamId } from "@/selectors";
import type { MHMEvent } from "@/types/base";

/*
sat65:
xxx = CINT(14 * RND) + 1
PRINT "Ilta-Pekkis rankkaa sinut sarjan huonoimmaksi manageriksi!"
PRINT "Listan k„rjest„ l"ytyy "; lm(xxx)
RETURN
*/

const eventId = "worstManagerEver";

type WorstManagerEverData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  otherManager: string;
};

const event: MHMEvent<WorstManagerEverData> = {
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
      `__Ilta-Pekkis__ rankkaa sinut _kaikkien aikojen huonoimmaksi_ manageriksi! Listan kärjestä löytyy ${data.otherManager}.`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    yield* call(decrementMorale, team, 1);
  }
};

export default event;
