import { call, select } from "typed-redux-saga";
import { produce } from "immer";
import { addEvent, resolvedEvent } from "../../sagas/event";
import { managersArena } from "../selectors";
import { incrementBalance, renameArena } from "../../sagas/manager";
import { amount as a } from "../../services/format";
import type { MHMEvent } from "../../types/base";

const eventId = "otsohalli";

type OtsohalliData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  amount: number;
  agree?: boolean;
};

const event: MHMEvent<OtsohalliData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const arena = yield* select(managersArena(manager));

    if (["Mauto Areena", "Otso-Halli"].includes(arena.get("name"))) {
      return;
    }

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 800000,
      resolved: false
    });
  },

  options: () =>
    ({
      agree: "Kyllä. Olutraha kelpaa aina!",
      disagree: "Ei. Onpa kerrassaan moraaliton ehdotus!"
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
      `Suuri olutpanimo on halukas sponsoroimaan joukkuettasi! Se maksaa ${a(data.amount)} pekkaa, jos hallin nimi muutetaan __Otso-Halliksi__. Otatko tarjouksen vastaan?"`
    ];

    if (!data.resolved) return lines;

    if (data.agree) {
      lines.push(`Sponsoritarroja liimaillaan hallilla jo tätä lukiessasi.`);
    } else {
      lines.push(
        `Panimon edustaja on selvästi kummissaan, mutta ei voi kuin hyväksyä päätöksesi.`
      );
    }

    return lines;
  },

  process: function* (data) {
    const manager = data.manager;
    if (data.agree) {
      yield* call(incrementBalance, manager, data.amount);
      yield* call(renameArena, manager, "Otso-Halli");
    }
  }
};

export default event;
