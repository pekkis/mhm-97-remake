import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import {
  incrementBalance,
  incrementInsuranceExtra,
  setArenaLevel
} from "../../sagas/manager";
import { amount as a } from "../../services/format";
import {
  managerHasService,
  managersDifficulty,
  managersArena
} from "../selectors";
import arenas from "../../data/arenas";
import type { MHMEvent } from "../../types/base";

/*
IF ghalli = 1 THEN RETURN
IF hjalli < 7 THEN RETURN
PRINT "Hallissa riehunut tulipalo huonontaa sen ominaisuuksia. ™RR!"
vaksum = (100000 + 200000 * (hjalli - 3)) * 3
IF veikko = 1 THEN PRINT "Etel„l„ joutuu maksamaan "; vaksum; " pekkaa!": raha = raha + vaksum: palo = palo + 150 * hjalli
hjalli = hjalli - 3
IF vai = 4 THEN hjalli = hjalli - 1
RETURN
*/

const eventId = "arenaBurns";

type ArenaBurnsData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  newArenaLevel: number;
  amount: number;
  hasInsurance: boolean;
};

const event: MHMEvent<ArenaBurnsData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const difficulty = yield* select(managersDifficulty(manager));
    if (difficulty === 0) {
      return;
    }

    const currentArena = yield* select(managersArena(manager));
    if (currentArena.get("level") <= 5) {
      return;
    }

    const newArenaLevel = currentArena.get("level") - 3;

    const hasInsurance = yield* select(managerHasService(manager, "insurance"));
    const amount = !hasInsurance ? 0 : arenas[newArenaLevel].price * 3;

    yield* call(addEvent, {
      eventId,
      manager,
      newArenaLevel,
      amount,
      resolved: true,
      hasInsurance
    });
    return;
  },

  render: (data) => {
    const t = [`Hallissa riehunut tulipalo huonontaa sen ominaisuuksia. ÖRR!`];

    if (data.hasInsurance) {
      t.push(`Etelälä joutuu korvaamaan tuhoja ${a(data.amount)} pekalla!`);
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;
    const hasInsurance = data.hasInsurance;
    const amount = data.amount;
    const newArenaLevel = data.newArenaLevel;

    yield* call(setArenaLevel, manager, newArenaLevel);

    if (hasInsurance) {
      yield* call(incrementBalance, manager, amount);
      yield* call(incrementInsuranceExtra, manager, 90);
    }
  }
};

export default event;
