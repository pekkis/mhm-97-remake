import { call } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { incrementBalance } from "../../sagas/manager";
import { amount as a } from "../../services/format";
import type { MHMEvent } from "../../types/base";

/*
sat20:
PRINT "Maso TV ostaa seuraavan ottelunne televisiointioikeudet."
PRINT "He maksavat joukkueelle 30000 pekkaa."
raha = raha + 30000
*/

const eventId = "masotv";

type MasotvData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
};

const event: MHMEvent<MasotvData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true,
      amount: 30000
    });
    return;
  },

  render: (data) => {
    return [
      `__Maso TV__ ostaa seuraavan ottelunne televisiointioikeudet. He maksavat joukkueelle ${a(data.amount)} pekkaa.`
    ];
  },

  process: function* (data) {
    yield* call(incrementBalance, data.manager, data.amount);
  }
};

export default event;
