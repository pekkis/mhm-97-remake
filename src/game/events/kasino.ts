import { call, put } from "typed-redux-saga";
import { produce } from "immer";
import r from "@/services/random";
import { addEvent } from "@/sagas/event";
import { incrementBalance } from "@/sagas/manager";
import type { MHMEvent } from "@/types/base";

const eventId = "kasino";

type KasinoData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  amount: number;
  participate?: boolean;
  success?: boolean;
};

const event: MHMEvent<KasinoData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: false,
      amount: 150000
    });
  },

  options: () => {
    return {
      p: "Kaikki punaiselle!",
      m: "Kaikki mustalle!",
      e: "Ei. Uhkapeli on syntiä."
    };
  },

  resolve: function* (data, value) {
    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      if (value === "e") {
        draft.participate = false;
      } else {
        draft.participate = true;
        draft.success = r.pick([true, false]);
      }
    });

    yield* put({
      type: "EVENT_RESOLVE",
      payload: { id: resolved.id, event: resolved }
    });
  },

  render: (data) => {
    const lines = [
      `Olet eräänä iltana kasinolla.

  Yhtäkkiä ääni päässäsi sanoo: 'Laita ${data.amount} pekkaa joukkueen kassasta peliin, niin voitto on sinun!' Otatko riskin?`
    ];

    if (!data.resolved) {
      return lines;
    }

    if (!data.participate) {
      lines.push("Pelkuri.");
      return lines;
    }

    if (!data.success) {
      lines.push(`Hävisit. Voi voi sentään...`);
      return lines;
    }

    lines.push(
      `JESS! Voitit omasi takaisin sekä ${data.amount * 3} pekkaa lisää!`
    );
    return lines;
  },

  process: function* (data) {
    if (!data.participate) {
      return;
    }

    const victory = data.success ? data.amount * 3 : -data.amount;
    yield* call(incrementBalance, data.manager, victory);
  }
};

export default event;
