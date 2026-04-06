import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { decrementBalance, incrementInsuranceExtra } from "../../sagas/manager";
import { decrementMorale } from "../../sagas/team";
import { amount as a } from "../../services/format";
import { addEffect } from "../../sagas/team";
import { managersTeam, managerHasService } from "../selectors";
import type { MHMEvent } from "../../types/base";

const eventId = "hasselgren";

type HasselgrenData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
  hasInsurance: boolean;
};

const event: MHMEvent<HasselgrenData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const hasInsurance = yield* select(managerHasService(manager, "insurance"));

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 40000,
      resolved: true,
      hasInsurance
    });
    return;
  },

  render: (data) => {
    const t = [
      `Pelaaja __Thomas Hasselgren__ hakkasi edellisessä ottelussa erään pelaajan henkihieveriin! Hän saa 5 ottelun pelikiellon, ja muiden pelaajien moraali laskee! Lisäksi joukkueesi tuomitaan ${a(
        data.amount
      )} pekan sakkoihin!`
    ];

    if (data.hasInsurance) {
      t.push(`Etelälä maksaa sakot!`);
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;
    const hasInsurance = data.hasInsurance;
    const team = yield* select(managersTeam(manager));

    yield* call(addEffect, team.get("id"), ["strength"], -10, 5);
    yield* call(decrementMorale, team.get("id"), 5);

    if (hasInsurance) {
      yield* call(incrementInsuranceExtra, manager, 90);
    } else {
      yield* call(decrementBalance, manager, data.amount);
    }
  }
};

/*
sat29:
IF yk > 0 THEN RETURN
PRINT "Pelaaja Thomas Hasselgren hakkasi edellisess„ ottelussa er„„n pelaajan"
PRINT "henkihieveriin! H„n saa 5 ottelun pelikiellon, ja muiden pelaajien moraa-"
PRINT "li laskee! Lis„ksi joukkueesi tuomitaan 40.000 pekan sakkoihin!"
IF veikko = 1 THEN PRINT "Etel„l„ maksaa sakot!": palo = palo + 90 ELSE raha = raha - 40000
tauti2 = 10: yk = 5: mo = mo - 5
*/

export default event;
