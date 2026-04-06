import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { setArenaLevel } from "../../sagas/manager";
import { managersDifficulty, managersArena } from "../selectors";
import type { MHMEvent } from "../../types/base";

/*
sat34:
IF vai = 5 THEN RETURN
IF hjalli = 10 THEN RETURN
PRINT "Salaper„inen rahoitusyhti" 'VŽLIVETO INC.' kustantaa hallinne laajennuksen!"
hjalli = hjalli + 1
RETURN*/

const eventId = "valiveto";

type ValivetoData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  newArenaLevel: number;
};

const event: MHMEvent<ValivetoData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const difficulty = yield* select(managersDifficulty(manager));
    if (difficulty === 4) {
      return;
    }

    const currentArena = yield* select(managersArena(manager));
    if (currentArena.get("level") === 9) {
      return;
    }

    const newArenaLevel = currentArena.get("level") + 1;

    yield* call(addEvent, {
      eventId,
      manager,
      newArenaLevel,
      resolved: true,
    });
    return;
  },

  render: (_data) => {
    return [
      `Salaperäinen rahoitusyhtiö __Väliveto Inc.__ kustantaa hallinne laajennuksen!`,
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const newArenaLevel = data.newArenaLevel;

    yield* call(setArenaLevel, manager, newArenaLevel);
  },
};

export default event;
