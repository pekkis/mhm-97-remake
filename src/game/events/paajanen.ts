import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { addEffect } from "@/sagas/team";
import { managersTeam } from "@/selectors";
import { cinteger } from "@/services/random";
import type { MHMEvent } from "@/types/base";

/*

sat61:
IF yk > 0 THEN RETURN
xxx = CINT(3 * RND) + 2
PRINT "Ottelun tuomari Hekka Paajanen oli todella surkea. Kolmannessa er„ss„,"
PRINT "saatuasi j„„hyn syytt„, kohotat syytt„v„n keskisormesi miest„ kohti ja"
PRINT "lausut pari valittua sanaa h„nen taidoistaan!"
PRINT "Kurinpitovaliokunta l„tk„isee sinulle "; xxx; "ottelun toimitsijakiellon!"
yk = xxx
IF sarja = 1 THEN tauti2 = CINT(.14 * v(u))
IF sarja = 2 THEN tauti2 = CINT(.14 * vd(u))
RETURN
*/

const eventId = "paajanen";

type PaajanenData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  duration: number;
};

const event: MHMEvent<PaajanenData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const duration = cinteger(0, 3) + 2;

    yield* call(addEvent, {
      eventId,
      manager,
      duration,
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `Ottelun tuomari __Hekka Paajanen__ oli todella surkea. Kolmannessa erässä, saatuanne jäähyn syyttä, kohotat syyttävän keskisormesi miestä kohti ja lausut pari valittua sanaa hänen taidoistaan!

Kurinpitovaliokunta lätkäisee sinulle ${data.duration} ottelun toimitsijakiellon!`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeam(manager));

    const duration = data.duration;
    yield* call(
      addEffect,
      team.id,
      ["strength"],
      -Math.round(0.14 * team.strength),
      duration
    );
  }
};

export default event;
