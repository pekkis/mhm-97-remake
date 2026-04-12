import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { incrementStrength } from "@/sagas/team";
import { randomTeamFrom } from "@/selectors";
import { cinteger } from "@/services/random";
import type { MHMEvent } from "@/types/base";

/*
sat70:
xxx = CINT(11 * RND) + 1: IF sarja = 2 AND xxx = u THEN GOTO sat70
PRINT "Divisioonasta:"
PRINT ld(xxx); " ostaa ulkolaisvahvistuksen, josta kukaan ei ole koskaan"
PRINT "kuullut puhuttavankaan! Miehen kunto on siis t„ysi arvoitus."
nnn = CINT(10 * RND) + 1
vd(xxx) = vd(xxx) + nnn
RETURN
*/

const eventId = "randomDude";

type RandomDudeData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  strengthGain: number;
  team: number;
  teamName: string;
};

const event: MHMEvent<RandomDudeData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(randomTeamFrom(["division"]));
    const strengthGain = cinteger(0, 10) + 1;

    yield* call(addEvent, {
      eventId,
      manager,
      strengthGain,
      team: team.id,
      teamName: team.name,
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `Divisioonasta:

__${data.teamName}__ ostaa ulkolaisvahvistuksen, josta kukaan ei ole koskaan kuullut puhuttavankaan! Miehen pelikunto on siis täysi arvoitus.`
    ];
  },

  process: function* (data) {
    const team = data.team;
    const strengthGain = data.strengthGain;
    yield* call(incrementStrength, team, strengthGain);
  }
};

export default event;
