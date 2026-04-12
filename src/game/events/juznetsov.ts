import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { incrementInsuranceExtra, incrementBalance } from "@/sagas/manager";
import { addOpponentEffect } from "@/sagas/team";
import {
  managerHasService,
  managerCompetesIn,
  managersTeamId
} from "@/selectors";
import { cinteger } from "@/services/random";
import type { MHMEvent } from "@/types/base";

const eventId = "juznetsov";

type JuznetsovData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  effect: number;
  amount: number;
  duration: number;
  hasInsurance: boolean;
};

const event: MHMEvent<JuznetsovData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const hasInsurance = yield* select(managerHasService(manager, "insurance"));
    const competesInPHL = yield* select(managerCompetesIn(manager, "phl"));

    yield* call(addEvent, {
      eventId,
      manager,
      effect: competesInPHL ? 20 : 10,
      amount: 7000,
      duration: cinteger(0, 3) + 2,
      resolved: true,
      hasInsurance
    });
    return;
  },

  render: (data) => {
    const t = [
      `Auts! Venäläispakki Kuri Juznetsov törmää harjoituksissa pää edellä laitaan ja on seuraavat ${data.duration} ottelua pyörällä päästään!`
    ];

    if (data.hasInsurance) {
      t.push(`Etelälä joutuu maksamaan ${data.amount} pekkaa!`);
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;
    const hasInsurance = data.hasInsurance;
    const effect = data.effect;
    const team = yield* select(managersTeamId(manager));
    const amount = data.amount;

    yield* call(addOpponentEffect, team, ["strength"], effect, 5);

    if (hasInsurance) {
      yield* call(incrementBalance, manager, amount);
      yield* call(incrementInsuranceExtra, manager, 50);
    }
  }
};

/*
sat46:
IF ky > 0 THEN RETURN
c = CINT(3 * RND) + 2
PRINT "Auts! Ven„l„ispakki Kuri Juznetsov t"rm„„ harjoituksissa p„„ edell„ laitaan"
PRINT "ja on seuraavat "; c; " ottelua py"r„ll„ p„„st„„n!"
IF veikko = 1 THEN PRINT "Etel„l„ joutuu maksamaan 7.000 pekkaa!!": raha = raha + 7000: palo = palo + 50
ky = c
IF sarja = 1 THEN tauti3 = 20
IF sarja = 2 THEN tauti3 = 10
RETURN
*/

export default event;
