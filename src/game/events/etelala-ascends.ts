import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { managerHasService } from "@/selectors";
import { cinteger } from "@/services/random";
import { incrementServiceBasePrice } from "@/sagas/game";
import type { MHMEvent } from "@/types/base";

/*
sat74:
PRINT "Etel„l„ nostaa vakuutuksensa l„ht"hintoja!"
hinta = hinta + CINT(100 * RND) + 50
IF veikko = 1 THEN PRINT "Johtokunta l„hett„„ yhti"lle vihaisen nootin!"
RETURN
*/

const eventId = "etelalaAscends";

type EtelalaAscendsData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
  hasInsurance: boolean;
};

const event: MHMEvent<EtelalaAscendsData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const amount = cinteger(0, 100) + 50;

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
    const t = [`Etelälä nostaa vakuutuksensa lähtöhintoja!`];

    if (data.hasInsurance) {
      t.push(`Johtokunta lähettää yhtiölle vihaisen nootin!`);
    }

    return t;
  },

  process: function* (data) {
    const amount = data.amount;
    yield* call(incrementServiceBasePrice, "insurance", amount);
  }
};

export default event;
