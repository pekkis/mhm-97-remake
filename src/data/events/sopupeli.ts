import { call, select } from "typed-redux-saga";
import { produce } from "immer";
import { addEvent, resolvedEvent } from "../../sagas/event";
import { managerCompetesIn, managersTeamId } from "../selectors";
import { incrementBalance } from "../../sagas/manager";
import { addEffect } from "../../sagas/team";
import { amount as a } from "../../services/format";
import type { MHMEvent } from "../../types/base";

const eventId = "sopupeli";

type SopupeliData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  amount: number;
  agree?: boolean;
};

const event: MHMEvent<SopupeliData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const competesInPHL = yield* select(managerCompetesIn(manager, "phl"));
    const amount = competesInPHL ? 300000 : 150000;

    yield* call(addEvent, {
      eventId,
      manager,
      amount,
      resolved: false,
    });
  },

  options: () =>
    ({
      agree: "Kyllä. Sopu sijaa antaa!",
      disagree: "En. Kunnia ennen lompakkoa!",
    }) as any,

  resolve: function* (data, value) {
    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      draft.agree = value === "agree";
    });

    yield* call(resolvedEvent, resolved);
  },

  render: (data) => {
    const lines = [
      `Nimetön soittaja lupaa siirtää joukkueenne tilille ${a(data.amount)} pekkaa jos "järjestät" joukkueesi tappion seuraavassa ottelussa. Suostutko sopupeliin?`,
    ];

    if (!data.resolved) return lines;

    if (data.agree) {
      lines.push(`Soittaja lupaa suorittaa transaktion välittömästi.`);
    } else {
      lines.push(`Soittaja lyö luurin korvaasi.`);
    }

    return lines;
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    if (data.agree) {
      yield* call(incrementBalance, manager, data.amount);
      yield* call(addEffect, team, ["strength"], -1000, 1);
    }
  },
};

export default event;
