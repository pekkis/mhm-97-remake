import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { addEffect, decrementMorale } from "@/sagas/team";
import { managersTeam, managersMainCompetition } from "@/selectors";
import { cinteger } from "@/services/random";
import type { MHMEvent } from "@/types/base";

/*
sat63:
IF yk > 0 THEN RETURN
xxx = CINT(2 * RND) + 2
PRINT "Rento saunailta muuttuu katastrofiksi, kun ajaudutte joukkueenjohtajan"
PRINT "kanssa k„sirysyyn pelillisten erimielisyyksien vuoksi."
PRINT "Mies saa luonnollisesti potkut, ja uutta pelinjohtajaa etsit„„n."
PRINT "Moraali laskee, ja joukkueen peli menee v„h„ksi aikaa sekaisin."
yk = xxx
tauti2 = 40 - 10 * sarja
RETURN
*/

const eventId = "saunailta";

type SaunailtaData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  effect: number;
  duration: number;
};

const event: MHMEvent<SaunailtaData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const duration = cinteger(0, 2) + 2;
    const mainCompetition = yield* select(managersMainCompetition(manager));

    const effect = mainCompetition === "phl" ? -30 : -20;

    yield* call(addEvent, {
      eventId,
      manager,
      effect,
      duration,
      resolved: true
    });
    return;
  },

  render: () => {
    return [
      `Rento saunailta muuttuu katastrofiksi, kun ajaudutte joukkueenjohtajan kanssa käsirysyyn pelillisten erimielisyyksien vuoksi.

Mies saa luonnollisesti potkut, ja uutta joukkueenohtajaa etsitään. Moraali laskee, ja joukkueen peli menee vähäksi aikaa sekaisin.`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeam(manager));
    const duration = data.duration;
    const effect = data.effect;

    yield* call(decrementMorale, team.id, 5);
    yield* call(addEffect, team.id, ["strength"], effect, duration);
  }
};

export default event;
