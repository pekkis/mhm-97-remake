import { select, call } from "typed-redux-saga";
import { managersDifficulty } from "@/selectors";
import { amount as a } from "@/services/format";
import { addEvent } from "@/sagas/event";
import { incrementBalance, decrementBalance } from "@/sagas/manager";
import type { MHMEvent } from "@/types/base";

const eventId = "fanMerchandise";

/*
IF vai < 5 THEN PRINT "Fanituotteet myyv„t TODELLA hyvin! Viime kuukauden voitto 40000 pekkaa."
IF vai < 5 THEN raha = raha + 40000
IF vai = 5 THEN PRINT "Fanituotteet myyv„t TODELLA huonosti! Viime kuukauden tappio 40000 pekkaa."
IF vai = 5 THEN raha = raha - 40000
*/

type SalesKind = "good" | "bad";

type FanMerchandiseData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
  sales: SalesKind;
};

const event: MHMEvent<FanMerchandiseData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const difficulty = yield* select(managersDifficulty(manager));

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 40000,
      resolved: true,
      sales: difficulty === 4 ? "bad" : "good"
    });
  },

  render: (data) => {
    const t: string[] = [];
    if (data.sales === "good") {
      t.push(
        `Fanituotteet myyvät __todella hyvin__! Viime kuukauden voitto ${a(data.amount)} pekkaa.`
      );
    } else {
      t.push(
        `Fanituotteet myyvät __todella huonosti__! Viime kuukauden tappio ${a(data.amount)} pekkaa.`
      );
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;

    if (data.sales === "good") {
      yield* call(incrementBalance, manager, data.amount);
    } else {
      yield* call(decrementBalance, manager, data.amount);
    }
  }
};

export default event;
