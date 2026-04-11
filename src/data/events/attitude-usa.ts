import { call, select, all, put } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { flag } from "../selectors";
import { setFlag } from "../../sagas/game";
import { alterStrength } from "../../ducks/country";
import type { MHMEvent } from "../../types/base";

/*
sat79:
PRINT "Yhdysvalloissa asenne MM-kisoja kohtaan on muuttunut radikaalisti!"
IF unhl = 0 THEN PRINT "T„st„ edes kaikki parhaat jenkinpurijat tulevat kisoihin!"
IF unhl > 0 THEN PRINT "T„st„ l„htien supert„hdet pysyv„t kotona Jenkeiss„."
IF unhl = 0 THEN unhl = 35 ELSE unhl = 0
*/

const eventId = "attitudeUSA";

const difference = 35;

type AttitudeUSAData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  attitude: boolean;
  resolved: true;
};

const event: MHMEvent<AttitudeUSAData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const attitude = yield* select(flag("usa"));

    yield* call(addEvent, {
      eventId,
      manager,
      attitude: !attitude,
      resolved: true
    });
    return;
  },

  render: (data) => {
    const lines = [
      `__Yhdysvalloissa__ asenne MM-kisoja kohtaan on muuttunut radikaalisti.`
    ];

    if (data.attitude === true) {
      lines.push(
        `Tästä edespäin kaikki parhaat jenkinpurijat tulevat kisoihin!`
      );
    } else {
      lines.push(`Tästä lähtien supertähdet pysyvät kotona Jenkeissä.`);
    }

    return lines;
  },

  process: function* (data) {
    const attitude = data.attitude;
    const amount = attitude ? difference : -difference;
    yield* all([
      call(setFlag, "usa", attitude),
      put(alterStrength({ country: "US", amount }))
    ]);
  }
};

export default event;
