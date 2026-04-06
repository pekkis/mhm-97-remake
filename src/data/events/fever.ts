import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { incrementBalance, incrementInsuranceExtra } from "../../sagas/manager";
import { amount as a } from "../../services/format";
import { addEffect } from "../../sagas/team";
import { managersTeam, managerHasService } from "../selectors";
import type { MHMEvent } from "../../types/base";

/*
sat20:
PRINT "Omituinen kuumetauti iskee joukkueeseen. Puolet pelaajista makaa pe-"
PRINT "tiss„ seuraavan ottelun ajan!!"
IF veikko = 1 THEN PRINT "Etel„l„ korvaa teille 10.000 pekkaa!": raha = raha + 10000: palo = palo + 90
IF sarja = 1 THEN tauti = v(u) / 2: mo = mo - 6
IF sarja = 2 THEN tauti = vd(u) / 2: mo = mo - 6
RETURN
*/

const eventId = "fever";

type FeverData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
  hasInsurance: boolean;
};

const event: MHMEvent<FeverData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const hasInsurance = yield* select(managerHasService(manager, "insurance"));

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 10000,
      resolved: true,
      hasInsurance
    });
    return;
  },

  render: (data) => {
    const t = [
      `Omituinen kuumetauti iskee joukkueeseen. Puolet pelaajista makaa petissä seuraavan ottelun ajan!`
    ];

    if (data.hasInsurance) {
      t.push(`Etelälä korvaa ${a(data.amount)} pekkaa.`);
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;
    const hasInsurance = data.hasInsurance;
    const team = yield* select(managersTeam(manager));

    yield* call(
      addEffect,
      team.id,
      ["strength"],
      -Math.round(team.strength * 0.5),
      1
    );
    yield* call(addEffect, team.id, ["morale"], -6, 1);

    if (hasInsurance) {
      yield* call(incrementBalance, manager, data.amount);
      yield* call(incrementInsuranceExtra, manager, 90);
    }
  }
};

export default event;
