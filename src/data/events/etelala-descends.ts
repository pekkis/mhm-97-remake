import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { managerHasService } from "../selectors";
import { cinteger } from "../../services/random";
import { incrementServiceBasePrice } from "../../sagas/game";
import type { MHMEvent } from "../../types/base";

/*
sat75:
PRINT "Etel„l„ laskee vakuutuksensa l„ht"hintoja!"
hinta = hinta - CINT(100 * RND) + 50
IF veikko = 1 THEN PRINT "Johtokunta kiittelee yhti"n p„„t"st„!"
RETURN
*/

const eventId = "etelalaDescends";

type EtelalaDescendsData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
  hasInsurance: boolean;
};

const event: MHMEvent<EtelalaDescendsData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const amount = -(cinteger(0, 100) + 50);

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
    const t = [`Etelälä laskee vakuutuksensa lähtöhintoja!`];

    if (data.hasInsurance) {
      t.push(`Johtokunta kiittelee yhtiön päätöstä!`);
    }

    return t;
  },

  process: function* (data) {
    const amount = data.amount;
    yield* call(incrementServiceBasePrice, "insurance", amount);
  }
};

export default event;
