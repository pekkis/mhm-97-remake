import { call, put } from "typed-redux-saga";
import { produce } from "immer";
import { amount as a } from "@/services/format";
import { addEvent } from "@/sagas/event";
import { resolveEventAction } from "@/ducks/event";
import type { MHMEvent } from "@/types/base";

const eventId = "suddenDeath";

type SuddenDeathData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  amount: number;
  hasInsurance?: boolean;
};

const texts = (data: SuddenDeathData): string[] => {
  const lines = [
    `Kaikki pelaajasi ovat saaneet surmansa lento-onnettomuudessa! Johtokunta kehottaa sinua etsimään uusia kiekkoilijoita`
  ];

  if (data.hasInsurance) {
    lines.push(`Etelälä joutuu maksamaan sinulle ${a(data.amount)} pekkaa`);
  }

  if (!data.resolved) {
    return lines;
  }

  lines.push(`Uskoitko? Ainakin ensimmäisellä kerralla... :)`);
  return lines;
};

const event: MHMEvent<SuddenDeathData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 15000000,
      resolved: false
    });
  },

  options: () => {
    return {
      ok: `Aaaaasia selvä. `,
      wtf: `Hiiiieno homma. Kiitos infosta.`
    };
  },

  resolve: function* (data) {
    const resolved = produce(data, (draft) => {
      draft.resolved = true;
    });

    yield* put(resolveEventAction({ id: resolved.id, event: resolved }));
  },

  render: (data) => {
    return texts(data);
  },

  process: function* () {}
};

export default event;
