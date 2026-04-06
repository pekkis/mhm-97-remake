import { call, select } from "typed-redux-saga";
import { Map } from "immutable";
import { addEvent } from "../../sagas/event";
import { addEffect } from "../../sagas/team";
import {
  managerCompetesIn,
  managerFlag,
  managersTeamId,
  managersDifficulty,
} from "../selectors";
import { setFlag, setExtra } from "../../sagas/manager";
import difficultyLevels from "../../data/difficulty-levels";
import type { MHMEvent } from "../../types/base";

/*
IF sarja = 1 THEN RETURN
IF ralli = 1 THEN RETURN
PRINT "Olet onnistunut luomaan k„sitt„m„tt"m„n yhteishengen, ja joukkue"
PRINT "on valmis taistelemaan tiens„ liigaan!!!"
extra = 10000
ralli = 1
*/

const eventId = "divisionRally";

type DivisionRallyData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
};

const event: MHMEvent<DivisionRallyData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const competesInDivision = yield* select(
      managerCompetesIn(manager, "division"),
    );

    if (!competesInDivision) {
      return;
    }

    const flagValue = yield* select(managerFlag(manager, "rally"));
    if (flagValue) {
      return;
    }

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true,
    });
    return;
  },

  render: (_data) => {
    return [
      `Olet onnistunut luomaan käsittämättömän yhteishengen, ja joukkue on valmis taistelemaan tiensä liigaan!!!`,
    ];
  },

  process: function* (data) {
    const manager = data.manager;

    const team = yield* select(managersTeamId(manager));
    const duration = 1000;

    const difficulty = yield* select(managersDifficulty(manager));

    yield* call(setFlag, manager, "rally", true);

    yield* call(
      setExtra,
      manager,
      (difficultyLevels.getIn([difficulty, "rallyExtra"]) as any)("division"),
    );

    yield* call(
      addEffect,
      team,
      ["morale"],
      "rally",
      duration,
      Map({
        rallyMorale: difficultyLevels.getIn([difficulty, "rallyMorale"]) as any,
      }),
    );
  },
};

/*
sat51:
y = CINT(14 * RND) + 1
x = CINT(11 * RND) + 1
*/

export default event;
