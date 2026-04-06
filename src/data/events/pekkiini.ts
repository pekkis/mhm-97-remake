import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { managersDifficulty, managersTeam } from "../selectors";
import { addEffect } from "../../sagas/team";
import type { MHMEvent } from "../../types/base";

/*
IF yk > 0 THEN RETURN
ccc = 8 - vai
c = CINT(ccc * RND) + 1
PRINT "On l"ytynyt uusi piriste, PEKKIINI, jota ei ole viel„ ehditty kielt„„."
PRINT "Laki aineen kiellosta astuu kuitenkin voimaan "; c; " viikon kuluttua,"
PRINT "ja tohtorinne pumppaa pelaajat t„yteen huumetta niin pitk„ksi aikaa kuin"
PRINT "mahdollista!"
yk = c
IF sarja = 1 THEN tauti2 = (v(u) / 2) * -1
IF sarja = 2 THEN tauti2 = (vd(u) / 2) * -1
RETURN*/

const eventId = "pekkiini";

type PekkiiniData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  amount: number;
  duration: number;
};

const event: MHMEvent<PekkiiniData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const difficulty = yield* select(managersDifficulty(manager));
    const team = yield* select(managersTeam(manager));

    yield* call(addEvent, {
      eventId,
      manager,
      amount: Math.round(team.strength * 0.5),
      duration: 7 - difficulty,
      resolved: true
    });
  },

  render: (data) => {
    return [
      `On löytynyt uusi piriste, __pekkiini__, jota ei ole vielä ehditty kieltämään. Laki aineen kiellosta astuu valitettavasti voimaan jo _${data.duration} viikon kuluttua_, mutta tohtorinne pumppaa pelaajat täyteen tehoainetta niin pitkäksi aikaa kuin mahdollista!`
    ];
  },

  process: function* (data) {
    const team = yield* select(managersTeam(data.manager));
    yield* call(
      addEffect,
      team.id,
      ["strength"],
      data.amount,
      data.duration
    );
  }
};

export default event;
