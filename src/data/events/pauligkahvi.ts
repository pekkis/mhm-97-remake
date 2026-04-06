import { call, select } from "typed-redux-saga";
import { produce } from "immer";
import { addEvent, resolvedEvent } from "../../sagas/event";
import { addOpponentEffect } from "../../sagas/team";
import { managersTeamId, managerCompetesIn } from "../selectors";
import { decrementBalance } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

const eventId = "pauligkahvi";

type PauligkahviData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  amount: number;
  duration: number;
  agree?: boolean;
};

const event: MHMEvent<PauligkahviData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const competesInPHL = yield* select(managerCompetesIn(manager, "phl"));
    if (!competesInPHL) return;

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 100000,
      resolved: false,
      duration: 3
    });
  },

  options: () =>
    ({
      agree: "Suostun.",
      disagree: "En suostu."
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
      `Superpakillesi, Pauli G. Kahville, ei pikkuraha enää riitä. Mies vaatii ${data.amount} pekan korotusta ja edustusautoa. Suostutko?`
    ];

    if (!data.resolved) return lines;

    if (data.agree) {
      lines.push(`Pauli hymyilee muikeasti.`);
    } else {
      lines.push(`Mies mutisee jotakin kapinasta poistuessaan luotasi.`);
    }

    return lines;
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    const strength = 50;
    const amount = data.amount;
    const duration = data.duration;

    if (data.agree) {
      yield* call(decrementBalance, manager, amount);
      yield* call(addOpponentEffect, team, ["strength"], -strength, duration);
    } else {
      yield* call(addOpponentEffect, team, ["strength"], strength, duration);
    }
  }
};

export default event;
