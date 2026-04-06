import { select, call } from "typed-redux-saga";
import { managerCompetesIn, managersDifficulty } from "../selectors";
import { amount as a } from "../../services/format";
import { addEvent } from "../../sagas/event";
import { decrementBalance } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

/*
sat13:
IF sarja = 1 THEN matky = 100000
IF sarja = 2 THEN matky = 50000
IF vai > 3 THEN matky = matky + 40000
IF vai < 2 THEN matky = matky - 20000
PRINT "Aaaaargh! Verokarhu p„„tt„„ m„tk„ist„ "; matky; " pekan lis„veron joukkueellesi!"
raha = raha - matky
*/

const getAmount = (competesInPHL: boolean, difficulty: number): number => {
  const amount = competesInPHL ? 100000 : 50000;

  if ([0, 1].includes(difficulty)) {
    return amount;
  }

  if ([2, 3].includes(difficulty)) {
    return amount + 40000;
  }

  return amount - 20000;
};

const eventId = "moreTaxes";

type MoreTaxesData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
};

const event: MHMEvent<MoreTaxesData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const competesInPHL = yield* select(managerCompetesIn(manager, "phl"));
    const difficulty = yield* select(managersDifficulty(manager));

    const amount = getAmount(competesInPHL, difficulty);

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true,
      amount,
    });
  },

  render: (data) => {
    return [
      `Aaaaargh! Verokarhu päättää mätkäistä ${a(data.amount)} pekan lisäveron joukkueellesi!`,
    ];
  },

  process: function* (data) {
    yield* call(decrementBalance, data.manager, data.amount);
  },
};

export default event;
