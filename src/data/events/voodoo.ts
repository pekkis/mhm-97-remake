import { select, call } from "typed-redux-saga";
import { produce } from "immer";
import { managersTeamId } from "../selectors";
import { amount as a } from "../../services/format";
import { addEvent, resolvedEvent } from "../../sagas/event";
import { incrementMorale, decrementMorale } from "../../sagas/team";
import { decrementBalance } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

const eventId = "voodoo";

type VoodooData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  amount: number;
  agree?: boolean;
};

const event: MHMEvent<VoodooData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 100000,
      resolved: false
    });
  },

  options: () => {
    return {
      agree: `Totta kai. Tervetuloa harjoituksiimme, hyvä herra, tässä rahat!`,
      disagree: "En maksa. Kiitos tarjouksesta, ehkä joku toinen kerta!"
    };
  },

  resolve: function* (data, value) {
    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      draft.agree = value === "agree";
    });

    yield* call(resolvedEvent, resolved);
  },

  render: (data) => {
    const lines = [
      `Haitilta saapunut tumma mies lupaa tuplata joukkueesi voiman ${a(data.amount)} pekalla. Maksatko?`
    ];

    if (!data.resolved) {
      return lines;
    }

    if (data.agree) {
      lines.push("Yhteishenki paranee kun pelaajat uskovat itseensä enemmän!!");
    } else {
      lines.push(`Mies vilauttaa sinulle voodoo-nukkeaan...`);
    }

    return lines;
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));

    if (data.agree) {
      yield* call(incrementMorale, team, 10000);
      yield* call(decrementBalance, manager, data.amount);
    } else {
      yield* call(decrementMorale, team, 1);
    }
  }
};

export default event;
