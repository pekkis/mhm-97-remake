import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { incrementBalance } from "../../sagas/manager";
import { decrementMorale } from "../../sagas/team";
import { amount as a } from "../../services/format";
import { managersTeamId } from "@/selectors";
import type { MHMEvent } from "../../types/base";

/*
PRINT "Mainostoimisto maksaa 55000 pekkaa joukkueen esiintymisest„ vaippa-"
PRINT "mainoksessa. Ihmiset nauravat, ja moraali laskee!"
raha = raha + 55000: mo = mo - 3
*/

const eventId = "pempers";

type PempersData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
  moraleLost: number;
};

const event: MHMEvent<PempersData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true,
      amount: 55000,
      moraleLost: 3
    });
    return;
  },

  render: (data) => {
    return [
      `Mainostoimisto maksaa ${a(data.amount)} pekkaa joukkueen esiintymisestä vaippamainoksessa. Ihmiset nauravat, ja moraali laskee!`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));

    yield* call(incrementBalance, manager, data.amount);
    yield* call(decrementMorale, team, data.moraleLost);
  }
};

export default event;
