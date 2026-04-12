import { select, call } from "typed-redux-saga";
import {
  managersTeamId,
  teamCompetesIn,
  managerHasService
} from "@/selectors";
import { amount as a } from "../../services/format";
import { incrementMorale } from "../../sagas/team";
import { addEvent } from "../../sagas/event";
import { incrementBalance, incrementInsuranceExtra } from "../../sagas/manager";
import { decrementStrength } from "../../sagas/team";
import type { MHMEvent } from "../../types/base";

const eventId = "swedenTransfer";

type SwedenTransferData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  team: number;
  amount: number;
  hasInsurance: boolean;
  moraleBoost: number;
  strengthLoss: number;
};

const event: MHMEvent<SwedenTransferData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;
    const team = yield* select(managersTeamId(manager));

    const playsInPHL = yield* select(teamCompetesIn(team, "phl"));
    const moraleBoost = playsInPHL ? -2 : 2;
    const strengthLoss = playsInPHL ? 12 : 7;

    const hasInsurance = yield* select(managerHasService(manager, "insurance"));

    yield* call(addEvent, {
      eventId,
      manager,
      team,
      amount: 30000,
      hasInsurance,
      moraleBoost,
      strengthLoss,
      resolved: true
    });
  },

  render: (data) => {
    const t = [
      `Joukkueen nuori, lupaava taituri siirtyy Ruotsiin kesken kauden. Nyyh! Ruotsalaiset korvaavat menetyksen ${a(
        data.amount
      )} pekalla!`
    ];

    if (data.hasInsurance) {
      t.push(`Etelälältä saat lisäksi ${a(data.amount)} pekkaa.`);
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;
    const team = data.team;
    const amount = data.amount;
    const strengthLoss = data.strengthLoss;
    const hasInsurance = data.hasInsurance;
    const moraleBoost = data.moraleBoost;

    yield* call(decrementStrength, team, strengthLoss);
    yield* call(incrementMorale, team, moraleBoost);
    yield* call(incrementBalance, manager, amount);

    if (hasInsurance) {
      yield* call(incrementBalance, manager, amount / 2);
      yield* call(incrementInsuranceExtra, manager, 100);
    }
  }
};

/*
sat11:
PRINT "Joukkueen nuori, lupaava taituri siirtyy Ruotsiin kesken kauden. Nyyh!"
PRINT "Ruotsalaiset korvaavat menetyksen 30000 pekalla!"
IF veikko = 1 THEN PRINT "Etel„l„lt„ saat lis„ksi 17.000 pekkaa!": raha = raha + 17000: palo = palo + 100
IF sarja = 1 THEN raha = raha + 30000: v(u) = v(u) - 12: mo = mo - 2
IF sarja = 2 THEN raha = raha + 30000: vd(u) = vd(u) - 7: mo = mo + 2
*/

export default event;
