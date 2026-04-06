import { call, select } from "typed-redux-saga";
import { produce } from "immer";
import { addEvent, resolvedEvent } from "../../sagas/event";
import { addOpponentEffect } from "../../sagas/team";
import { managersTeamId } from "../selectors";
import { amount as a } from "../../services/format";
import { decrementBalance } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

const eventId = "kecklin";

type KecklinData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  amount: number;
  duration: number;
  agree?: boolean;
};

const event: MHMEvent<KecklinData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 150000,
      resolved: false,
      duration: 3
    });
  },

  options: () =>
    ({
      agree: "Suostun, mutta vain pakon edessä.",
      disagree: "Ei tule kuulonkaan."
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
      `Ykkösmaalivahtinne Limmo Kecklin haluaa ${a(data.amount)} pekan palkankorotuksen. Suostutko?`
    ];

    if (!data.resolved) {
      return lines;
    }

    if (!data.agree) {
      lines.push(
        `Kecklin kohauttaa olkapäitään. "No, aina kannattaa yrittää."`
      );
    } else {
      lines.push(`Kecklin on oikein tyytyväinen itseensä poistuessaan.`);
    }

    return lines;
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    const strength = data.agree ? -65 : 65;
    const amount = data.amount;

    if (data.agree) {
      yield* call(decrementBalance, manager, amount);
    }

    yield* call(addOpponentEffect, team, ["strength"], strength, 1);
  }
};

export default event;
