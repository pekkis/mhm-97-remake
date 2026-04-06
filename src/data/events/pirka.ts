import { call } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { incrementBalance } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

const eventId = "pirka";

type PirkaData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
};

const event: MHMEvent<PirkaData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true,
      amount: 80000,
    });
    return;
  },

  render: (data) => {
    return [
      `Ikääntynyt rokkitähti, __Pirka__, kuolee ja lahjoittaa koko omaisuutensa joukkueelle (${data.amount} pekkaa ja kiinanpalatsikoiran).`,
    ];
  },

  process: function* (data) {
    yield* call(incrementBalance, data.manager, data.amount);
  },
};

export default event;
