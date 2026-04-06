import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { managerHasService } from "../selectors";
import { amount as a } from "../../services/format";
import { decrementBalance, incrementInsuranceExtra } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

/*
sat81:
IF sarja = 2 THEN RETURN
PRINT "Espanjalaisvahvistuksesi Jorg‚ Ramirez, liigan komeimmaksi ja egoistisim-"
PRINT "maksi mainittu pelaaja, kompastuu harjoituksissa kaatuen ja murtaen"
PRINT "nen„ns„! Sopimuksen erikoispyk„l„ velvoittaa sinut maksamaan"
PRINT "plastiikkakirurgikulut, 90.000 pekkaa!"
IF veikko = 1 THEN PRINT "Etel„l„ maksaa viulut!": palo = palo + 50:  ELSE raha = raha - 90000
*/

const eventId = "ramirez";

type RamirezData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  hasInsurance: boolean;
  amount: number;
};

const event: MHMEvent<RamirezData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const hasInsurance = yield* select(managerHasService(manager, "insurance"));

    yield* call(addEvent, {
      eventId,
      manager,
      hasInsurance,
      amount: 90000,
      resolved: true
    });
    return;
  },

  render: (data) => {
    const t = [
      `Espanjalaisvahvistuksesi __Jorge Ramirez__, liigan komeimmaksi ja egoistisimmaksi mainittu pelaaja, kompastuu harjoituksissa kaatuen ja murtaen kuuluisan kyömynenänsä! Sopimuksen erikoispykälä velvoittaa sinut maksamaan plastiikkakirurgikulut, ${a(data.amount)} pekkaa!`
    ];

    if (data.hasInsurance) {
      t.push(`Etelälä maksaa viulut!`);
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;
    const hasInsurance = data.hasInsurance;

    if (hasInsurance) {
      yield* call(incrementInsuranceExtra, manager, 50);
    } else {
      const amount = data.amount;
      yield* call(decrementBalance, manager, amount);
    }
  }
};

export default event;
