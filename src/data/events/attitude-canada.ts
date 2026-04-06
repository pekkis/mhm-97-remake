import { Map } from "immutable";
import { call, select, put, all } from "redux-saga/effects";
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

const event: MHMEvent = {
  type: "manager",

  create: function* (data: any) {
    const { manager } = data;

    const attitude = yield select(flag("canada"));

    yield call(
      addEvent,
      Map({
        eventId,
        manager,
        attitude: !attitude,
        resolved: true
      })
    );
  },

  render: (data) => {
    const lines = [
      `__Kanadassa__ asenne MM-kisoja kohtaan on muuttunut radikaalisti.`
    ];

    if (data.get("attitude") === true) {
      lines.push(`Tästä edespäin kaikki supertähdet tulevat kisoihin!`);
    } else {
      lines.push(`Tästä lähtien heitä edustaa rupuinen yliopistojoukkue!`);
    }

    return lines;
  },

  process: function* (data) {
    const attitude = data.get("attitude");
    const amount = attitude ? difference : -difference;
    yield all([
      call(setFlag, "canada", attitude),
      put(alterStrength("CA", amount))
    ]);
  }
};

export default event;
