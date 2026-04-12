import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { addOpponentEffect } from "../../sagas/team";
import {
  managerCompetesIn,
  managerHasService,
  managersTeamId
} from "@/selectors";
import { amount as a } from "../../services/format";
import { incrementBalance, incrementInsuranceExtra } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

const eventId = "laskisalonen";

type LaskisalonenData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  strength: number;
  duration: number;
  hasInsurance: boolean;
  amount: number;
};

const event: MHMEvent<LaskisalonenData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const competesInPHL = yield* select(managerCompetesIn(manager, "phl"));
    const strength = competesInPHL ? -150 : -75;

    const hasInsurance = yield* select(managerHasService(manager, "insurance"));

    yield* call(addEvent, {
      eventId,
      manager,
      strength,
      resolved: true,
      duration: 1,
      hasInsurance,
      amount: 35000
    });
    return;
  },

  render: (data) => {
    const t = [
      `Molemmat maalivahtinne ovat loukkaantuneet! Ainoa halukas tuuraaja on 300-kiloinen __Läski-Salonen__, joka kaikeksi onneksi tukkii maalin _tosi tehokkaasti_, mutta valitettavasti vain ${data.duration} ottelun ajan!`
    ];

    if (data.hasInsurance) {
      t.push(
        `Etelälä on velvollinen maksamaan korvauksina ${a(data.amount)} pekkaa!`
      );
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;
    const strength = data.strength;
    const duration = data.duration;
    const team = yield* select(managersTeamId(manager));
    const hasInsurance = data.hasInsurance;
    const amount = data.amount;

    yield* call(addOpponentEffect, team, ["strength"], strength, duration);

    if (hasInsurance) {
      yield* call(incrementBalance, manager, amount);
      yield* call(incrementInsuranceExtra, manager, 90);
    }
  }
};

/*
sat43:
IF ky > 0 THEN RETURN
PRINT "Molemmat maalivahtinne ovat loukkaantuneet! Ainoa halukas tuuraaja on"
PRINT "300-kiloinen L„ski-Salonen, joka kaikeksi onneksi tukkii maalin TOSI tehok-"
PRINT "kaasti, mutta vain 1 ottelun ajan! "
IF veikko = 1 THEN PRINT "Etel„l„ on velvollinen maksamaan korvauksina 35.000 pekkaa!": raha = raha + 35000: palo = palo + 90
ky = 1
IF sarja = 2 THEN tauti3 = -50
IF sarja = 1 THEN tauti3 = -100
RETURN
*/

export default event;
