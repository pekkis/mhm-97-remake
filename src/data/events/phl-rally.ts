import { call, select } from "typed-redux-saga";
import { Map } from "immutable";
import { addEvent } from "../../sagas/event";
import { addEffect } from "../../sagas/team";
import {
  managerCompetesIn,
  managerFlag,
  managersTeamId,
  managersDifficulty
} from "../selectors";
import { setFlag, setExtra } from "../../sagas/manager";
import difficultyLevels from "../../data/difficulty-levels";
import type { MHMEvent } from "../../types/base";

/*
IF sarja = 2 THEN RETURN
IF ralli = 1 THEN RETURN
PRINT "Uusi ohjelmanjulistuksesi 'KULTA ON VŽRIMME' saa aikaan todellisen"
PRINT "j„„kiekkobuumin! Kansa rynt„„ hallille ja taistelu mestaruudesta on"
PRINT "todella alkanut!"*/

const eventId = "phlRally";

type PhlRallyData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
};

const event: MHMEvent<PhlRallyData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const competesInPHL = yield* select(managerCompetesIn(manager, "phl"));
    if (!competesInPHL) {
      return;
    }

    const flagValue = yield* select(managerFlag(manager, "rally"));
    if (flagValue) {
      return;
    }

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true
    });
    return;
  },

  render: (_data) => {
    return [
      `Uusi ohjelmanjulistuksesi "KULTA ON VÄRIMME" saa aikaan todellisen jääkiekkobuumin! Kansa ryntää hallille ja taistelu mestaruudesta on todella alkanut`
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
      difficultyLevels[difficulty].rallyExtra("phl")
    );

    yield* call(
      addEffect,
      team,
      ["morale"],
      "rally",
      duration,
      Map({
        rallyMorale: difficultyLevels[difficulty].rallyMorale
      })
    );
  }
};

/*
sat51:
y = CINT(14 * RND) + 1
x = CINT(11 * RND) + 1
xx = 45 - kr
IF sarja = 2 AND x = u THEN GOTO sat51
IF ssa(x) > 0 THEN GOTO sat51
PRINT "Divisioonasta:"
PRINT ld(x); " on p„„tt„nyt manageriguru "; lm(y); ":n johdolla"
PRINT "nousta liigaan! He ovat hirmukunnossa!"
ssa(x) = xx
tadv(x) = vd(x) / 2
RETURN
*/

export default event;
