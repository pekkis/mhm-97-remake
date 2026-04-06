import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { incrementInsuranceExtra } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

/*
sat77:
IF CINT(100 * RND) < 50 THEN RETURN
PRINT "Etel„l„n tietokoneeseen on isketty virus! Kaikki vakuutustiedot ovat"
PRINT "kadonneet, ja siten bonukset nollautuvat!"
palo = 0
RETURN
*/

const eventId = "etelalaGlitch";

type EtelalaGlitchData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
};

const event: MHMEvent<EtelalaGlitchData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true
    });
    return;
  },

  render: () => {
    return [
      `__Etelälän__ tietokoneeseen on iskenyt _virus_! Kaikki vakuutustiedot ovat kadonneet, ja siten bonukset nollautuvat!`
    ];
  },

  process: function* (data) {
    const manager = data.manager;

    const current = yield* select((state: any) =>
      state.manager.getIn(["managers", manager, "insuranceExtra"])
    );

    yield* call(incrementInsuranceExtra, manager, 0 - current);
  }
};

export default event;
