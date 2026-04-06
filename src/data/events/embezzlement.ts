import { call, select } from "typed-redux-saga";
import {
  managersDifficulty,
  managerObject,
  managerHasService
} from "../selectors";
import { amount as a } from "../../services/format";
import { addEvent } from "../../sagas/event";
import {
  incrementBalance,
  decrementBalance,
  incrementInsuranceExtra
} from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

const eventId = "embezzlement";

type EmbezzlementData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amountEmbezzled: number;
  amountReimbursed: number;
};

const embezzledAmount = (balance: number, difficulty: number): number => {
  if (difficulty < 3) {
    return Math.round(0.1 * balance);
  }

  if (difficulty === 3) {
    return Math.round(0.15 * balance);
  }

  return Math.round(0.25 * balance);
};

const event: MHMEvent<EmbezzlementData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const managerObj = yield* select(managerObject(manager));

    if (!managerObj || managerObj.get("balance") < 100000) {
      return;
    }

    const difficulty = yield* select(managersDifficulty(manager));

    const amountEmbezzled = embezzledAmount(
      managerObj.get("balance"),
      difficulty
    );

    const hasInsurance = yield* select(managerHasService(manager, "insurance"));
    const amountReimbursed = hasInsurance
      ? Math.round(0.8 * amountEmbezzled)
      : 0;

    yield* call(addEvent, {
      eventId,
      manager,
      amountEmbezzled,
      amountReimbursed,
      resolved: true
    });
  },

  render: (data) => {
    const t = [
      `Yksi johtokunnan jäsen katoaa, vieden mukanaan aimo siivun joukkueen kassasta. Tililtänne uupuu yhteensä __${a(
        data.amountEmbezzled
      )}__ pekkaa.`
    ];
    if (data.amountReimbursed) {
      t.push(
        `Etelälä maksaa teille korvauksena __${a(
          data.amountReimbursed
        )}__ pekkaa.`
      );
    }
    return t;
  },

  process: function* (data) {
    const manager = data.manager;

    yield* call(decrementBalance, manager, data.amountEmbezzled);

    if (data.amountReimbursed) {
      yield* call(incrementBalance, manager, data.amountReimbursed);
      yield* call(
        incrementInsuranceExtra,
        manager,
        Math.round(data.amountReimbursed / 60)
      );
    }
  }
};

/*
sat19:
IF raha < 100000 THEN RETURN
IF vai < 4 THEN ccc = 10
IF vai = 4 THEN ccc = 8
IF vai = 5 THEN ccc = 4
PRINT "Yksi johtokunnan j„sen katoaa, vieden mukanaan"; ccc; "-osan kassasta!"
pimitys = raha / ccc
vaksum = raha / (ccc + 1)
IF veikko = 1 THEN PRINT "Etel„l„ maksaa teille "; vaksum; " pekkaa."
raha = raha - pimitys
IF veikko = 1 THEN raha = raha + vaksum: palo = palo + vaksum / 60
RETURN
*/

export default event;
