import { call, select, put, all } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { flag } from "../selectors";
import { setFlag } from "../../sagas/game";
import { alterStrength } from "../../ducks/country";
import type { MHMEvent } from "../../types/base";

/*
sat78:
PRINT "Kanadassa asenne MM-kisoja kohtaan on muuttunut radikaalisti!"
IF knhl = 0 THEN PRINT "T„st„ edes kaikki supert„hdet tulevat kisoihin!"
IF knhl > 0 THEN PRINT "T„st„ l„htien heit„ edustaa rupuinen yliopistojoukkue!"
IF knhl = 0 THEN knhl = 30 ELSE knhl = 0
RETURN*/

const eventId = "attitudeCanada";

const difference = 30;

type AttitudeCanadaData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  attitude: boolean;
  resolved: true;
};

const event: MHMEvent<AttitudeCanadaData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const attitude = yield* select(flag("canada"));

    yield* call(addEvent, {
      eventId,
      manager,
      attitude: !attitude,
      resolved: true
    });
  },

  render: (data) => {
    const lines = [
      `__Kanadassa__ asenne MM-kisoja kohtaan on muuttunut radikaalisti.`
    ];

    if (data.attitude === true) {
      lines.push(`Tästä edespäin kaikki supertähdet tulevat kisoihin!`);
    } else {
      lines.push(`Tästä lähtien heitä edustaa rupuinen yliopistojoukkue!`);
    }

    return lines;
  },

  process: function* (data) {
    const attitude = data.attitude;
    const amount = attitude ? difference : -difference;
    yield* all([
      call(setFlag, "canada", attitude),
      put(alterStrength({ country: "CA", amount }))
    ]);
  }
};

export default event;
