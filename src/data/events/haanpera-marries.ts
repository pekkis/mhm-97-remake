import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { addEffect, incrementMorale } from "../../sagas/team";
import { managersTeam, flag } from "../selectors";
import { setFlag } from "../../sagas/game";
import type { MHMEvent } from "../../types/base";

/*
sat25:
IF ero = 0 THEN RETURN
PRINT "Pelaaja Aki Haanper„n polttarit ovat seuraavana iltana. Koko joukkue on"
PRINT "mukana ja kankkunen vaivaa seuraavan ottelun ajan!"
IF sarja = 1 THEN tauti = 54
IF sarja = 2 THEN tauti = 27
ero = 0
RETURN
*/

const eventId = "haanperaMarries";

type HaanperaMarriesData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
};

const event: MHMEvent<HaanperaMarriesData> = {
  type: "manager",

  create: function* (data) {
    const isMarried = yield* select(flag("haanperaMarried"));
    if (isMarried) {
      return;
    }

    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true,
    });
    return;
  },

  render: (data) => {
    return [
      `Pelaaja Aki Haanperän polttarit ovat seuraavana iltana. Koko joukkue on mukana ja kankkunen vaivaa seuraavan ottelun ajan!`,
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeam(manager));

    yield* call(
      addEffect,
      team.get("id"),
      ["strength"],
      -Math.round(team.get("strength") * 0.33),
      1,
    );
    yield* call(incrementMorale, team.get("id"), 4);
    yield* call(setFlag, "haanperaMarried", true);
  },
};

export default event;
