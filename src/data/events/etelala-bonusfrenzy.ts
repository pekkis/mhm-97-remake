import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { managerHasService, managersArena } from "../selectors";
import { amount as a } from "../../services/format";
import { incrementInsuranceExtra } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

/*
sat76:
PRINT "Etel„l„ julkistaa suuren kansainv„lisen BONUSTEMPAUKSEN!"
IF veikko = 1 THEN PRINT "Vakuutussummasi laskee"; 30 * hjalli; "pekan verran!"
IF veikko = 1 THEN palo = palo - 30 * hjalli
RETURN*/

const eventId = "etelalaBonusFrenzy";

type EtelalaBonusFrenzyData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
  hasInsurance: boolean;
};

const event: MHMEvent<EtelalaBonusFrenzyData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const arena = yield* select(managersArena(manager));

    const amount = -(30 * (arena.level + 1));

    const hasInsurance = yield* select(managerHasService(manager, "insurance"));

    yield* call(addEvent, {
      eventId,
      manager,
      amount,
      hasInsurance,
      resolved: true
    });
    return;
  },

  render: (data) => {
    const t = [`Etelälä julkistaa suuren kansainvälisen __bonustempauksen__!`];

    if (data.hasInsurance) {
      t.push(
        `Vakuutussummasi laskee ${a(Math.abs(data.amount))} pekan verran!`
      );
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;
    const amount = data.amount;
    yield* call(incrementInsuranceExtra, manager, amount);
  }
};

export default event;
