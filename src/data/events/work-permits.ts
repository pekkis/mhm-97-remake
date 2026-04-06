import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { addEffect } from "../../sagas/team";
import { randomTeamFrom } from "../selectors";
import { cinteger } from "../../services/random";
import type { MHMEvent } from "../../types/base";

const eventId = "workPermits";

type WorkPermitsData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  duration: number;
  team: number;
  teamName: string;
};

const event: MHMEvent<WorkPermitsData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(randomTeamFrom(["phl"]));
    const duration = cinteger(0, 3) + 3;

    yield* call(addEvent, {
      eventId,
      manager,
      duration,
      team: team.id,
      teamName: team.name,
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `Liigasta:

${data.teamName}:lla on ongelmia ulkolaisvahvistustensa, Haso Otchakin sekä Malex Atsijevskin, työlupien kanssa. Joukkue heikentyy merkittävästi ${data.duration} ottelun ajaksi kun kyseiset herrat eivät pelaa.`
    ];
  },

  process: function* (data) {
    const team = data.team;
    const duration = data.duration;

    yield* call(addEffect, team, ["strength"], -35, duration);
  }
};

/*
x = CINT(11 * RND) + 1
xx = CINT(3 * RND) + 3
IF sarja = 1 AND x = u THEN GOTO sat47
IF ass(x) > 0 THEN GOTO sat47
PRINT "Liigasta:"
PRINT l(x); ":ll„ on ongelmia ulkolaisvahvistustensa, Haso Otchakin sek„"
PRINT "Malex Atsijevskin, ty"lupien kanssa. Joukkue heikentyy merkitt„v„sti "; xx
PRINT "ottelun ajaksi kun kyseiset herrat eiv„t pelaa."
ass(x) = xx
talg(x) = -35
*/

export default event;
