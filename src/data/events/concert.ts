import { call, select } from "typed-redux-saga";
import { managersArena } from "../selectors";
import { amount as a } from "../../services/format";
import { addEvent } from "../../sagas/event";
import { incrementBalance } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

const eventId = "concert";

type ConcertData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
};

const event: MHMEvent<ConcertData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const arena = yield* select(managersArena(manager));

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true,
      amount: 10000 + 20000 * (arena.get("level") + 1),
    });
    return;
  },

  render: (data) => {
    return [
      `Joukkueesi areenalla pidetään suuri rock-konsertti. Tuotto: ${a(data.amount)} pekkaa.`,
    ];
  },

  process: function* (data) {
    yield* call(incrementBalance, data.manager, data.amount);
  },
};

export default event;
