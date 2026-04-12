import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { incrementBalance, decrementBalance } from "@/sagas/manager";
import { amount as a } from "@/services/format";
import { managersDifficulty } from "@/selectors";
import type { MHMEvent } from "@/types/base";

/*
PRINT "Pankkinne on tehnyt virheen. Tilill„nne on 500.000 pekkaa liikaa."
PRINT "Kukaan ei huomaa mit„„n..."
IF vai >= 4 THEN PRINT "paitsi er„s pelaaja, jonka vaikeneminen maksaa 200.000 pekkaa!"
raha = raha + 500000
IF vai >= 4 THEN raha = raha - 200000
*/

const eventId = "bankMistake";

type BankMistakeData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
  bribe: number | false;
};

const event: MHMEvent<BankMistakeData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const difficulty = yield* select(managersDifficulty(manager));

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 500000,
      bribe: difficulty === 4 && 200000,
      resolved: true
    });
    return;
  },

  render: (data) => {
    const t = [
      `Pankkinne on tehnyt virheen. Tilillänne on __${a(data.amount)}__ pekkaa liikaa. Kukaan ei huomaa mitään...`
    ];

    if (data.bribe) {
      t.push(
        `... paitsi yksi erittäin tarkkaavainen pelaaja, jonka vaikeneminen maksaa __${a(data.bribe)}__ pekkaa.`
      );
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;
    const amount = data.amount;
    const bribe = data.bribe;

    yield* call(incrementBalance, manager, amount);
    if (bribe) {
      yield* call(decrementBalance, manager, bribe);
    }
  }
};

export default event;
