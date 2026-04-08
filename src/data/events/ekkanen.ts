import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { amount as a } from "../../services/format";
import {
  managersTeamId,
  managersDifficulty,
  managersArena,
  managersBalance
} from "../selectors";
import { incrementStrength } from "../../sagas/team";
import { setArenaLevel, incrementBalance } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

/*
PRINT "Tisa Ekkanen, loistava NHL-pelaaja, palaa kotimaahan monien vuosien"
PRINT "j„lkeen. H„n liittyy joukkueeseen ilmaiseksi, "
IF hjalli < 6 AND vai < 5 THEN PRINT "kustantaa hallin laajennuksen,": hjalli = hjalli + 1
IF raha < 500000 AND vai < 3 THEN PRINT "ja lahjoittaa seuralle 500000 pekkaa!": raha = raha + 500000
IF sarja = 1 THEN v(u) = v(u) + 17
IF sarja = 2 THEN vd(u) = vd(u) + 17
*/

const eventId = "ekkanen";

type EkkanenData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  strength: number;
  amount: number;
  expandArena: boolean;
  giveMoney: boolean;
  duration: number;
};

const event: MHMEvent<EkkanenData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const difficulty = yield* select(managersDifficulty(manager));
    const arena = yield* select(managersArena(manager));
    const balance = yield* select(managersBalance(manager));

    const expandArena = difficulty < 4 && arena.level < 5;
    const giveMoney = difficulty < 2 && balance < 500000;

    yield* call(addEvent, {
      eventId,
      manager,
      strength: 17,
      amount: 500000,
      expandArena,
      giveMoney,
      resolved: true,
      duration: 6
    });
    return;
  },

  render: (data) => {
    const t = [
      `Tisa Ekkanen, loistava NHL-pelaaja, palaa kotimaahan monien vuosien jälkeen. Hän liittyy joukkueeseen ilmaiseksi!`
    ];

    if (data.expandArena) {
      t.push(
        `Ekkanen on erityisen hövelillä päällä ja kustantaa hallisi laajennuksen.`
      );
    }

    if (data.giveMoney) {
      t.push(
        `Eikä siinä vielä kaikki. Ekkanen lahjoittaa seuralle ${a(data.amount)} pekkaa kylmää käteistä.`
      );
    }

    return t;
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    const strength = data.strength;
    const amount = data.amount;

    yield* call(incrementStrength, team, strength);
    if (data.expandArena) {
      const arena = yield* select(managersArena(manager));
      yield* call(setArenaLevel, manager, arena.level + 1);
    }

    if (data.giveMoney) {
      yield* call(incrementBalance, manager, amount);
    }
  }
};

export default event;
