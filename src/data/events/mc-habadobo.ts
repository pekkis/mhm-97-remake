import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { incrementMorale } from "../../sagas/team";
import {
  managersTeamId,
  managersMainCompetition,
  managersDifficulty,
  managersTeam,
  managerHasService,
  managersArena,
} from "../selectors";
import { amount as a } from "../../services/format";
import {
  decrementBalance,
  incrementBalance,
  incrementInsuranceExtra,
} from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

/*
sat72:
IF sarja = 2 THEN RETURN
IF v(u) < 250 THEN RETURN
IF vai < 4 THEN RETURN
PRINT "Joukkueen fanikaupan vieress„ sijaitsevaan MC Habadobon is„nn"im„„n"
PRINT "kapakkaan suunnattu sinkoisku osuu harhaan!! Lukematon m„„r„ fani-"
PRINT "tuotteita ja muuta s„l„„ tuhoutuu ja lasku kohoaa 650.000 pekkaan!!"
raha = raha - 650000
IF veikko = 1 THEN PRINT "Etel„l„ maksaa laskusta 532.300.": raha = raha + 532300: palo = palo + 40 * hjalli
RETURN
*/

const eventId = "mcHabadobo";

type McHabadoboData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  hasInsurance: boolean;
  amount: number;
  insuranceClaim: number;
};

const event: MHMEvent<McHabadoboData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const difficulty = yield* select(managersDifficulty(manager));
    if (difficulty < 3) {
      return;
    }

    const mainCompetition = yield* select(managersMainCompetition(manager));
    if (mainCompetition !== "phl") {
      return;
    }

    const team = yield* select(managersTeam(manager));

    if (team.get("strength") < 250) {
      return;
    }

    const hasInsurance = yield* select(
      managerHasService(manager, "insurance"),
    );

    const amount = 650000;
    const insuranceClaim = Math.round(0.8 * amount);

    yield* call(addEvent, {
      eventId,
      manager,
      hasInsurance,
      amount,
      insuranceClaim,
      resolved: true,
    });
    return;
  },

  render: (data) => {
    const t = [
      `Joukkueen fanikaupan vieressä sijaitsevaan moottoripyöräkerho __MC Habadobon__ isännöimään kapakkaan suunnattu leikkimielinen sinkoisku osuu harhaan!

Lukematon määrä fanituotteita ja muuta krääsää tuhoutuu. Lasku kohoaa ${a(
        data.amount,
      )} pekkaan!`,
    ];

    if (data.hasInsurance) {
      t.push(
        `Etelälä maksaa laskusta ${a(data.insuranceClaim)} pekkaa.`,
      );
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;
    const amount = data.amount;
    const hasInsurance = data.hasInsurance;
    const insuranceClaim = data.insuranceClaim;

    yield* call(decrementBalance, manager, amount);

    const currentArena = yield* select(managersArena(manager));

    if (hasInsurance) {
      yield* call(incrementBalance, manager, insuranceClaim);
      yield* call(
        incrementInsuranceExtra,
        manager,
        40 * (currentArena.get("level") + 1),
      );
    }
  },
};

export default event;
