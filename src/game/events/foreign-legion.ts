import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { addEffect } from "@/sagas/team";
import { randomTeamOrNullFrom, randomManager } from "@/selectors";
import type { MHMEvent } from "@/types/base";
import type { Team } from "@/state/game";

/*
sat93:
xx = 1000
bb1 = CINT(14 * RND) + 1
bb2 = CINT(14 * RND) + 1
IF bb1 = bb2 THEN GOTO sat93
satt93:
IF cccp = 20 THEN RETURN
cc = CINT(11 * RND) + 1
IF sarja = 1 AND cc = u THEN cccp = cccp + 1: GOTO satt93
IF v(cc) < 270 THEN cccp = cccp + 1: GOTO satt93
IF ass(x) > 0 THEN cccp = cccp + 1: GOTO satt93
PRINT l(cc); ":n huippujoukkue on t"rm„nnyt pelaajapolitiikallaan j„„vuoreen!"
PRINT "T„hti„ vilisev„ mestariehdokas on muuttunut riitaisaksi muukalaislegioo-"
PRINT "naksi jossa kaikki vihaavat kaikkia!"
PRINT "Manageri "; lm(bb1); " saa l„hte„, tilalle palkataan "; lm(bb2)
PRINT "mutta tilanne ei oletettavasti muutu mihink„„n..."
ass(cc) = xx
talg(cc) = -60
RETURN
*/

const eventId = "foreignLegion";

type ForeignLegionData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  duration: number;
  team: number;
  teamName: string;
  managerName: string;
  managerName2: string;
};

const event: MHMEvent<ForeignLegionData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(
      randomTeamOrNullFrom(["phl"], false, [], (t: Team) => t.strength >= 270)
    );
    if (!team) {
      return;
    }

    const duration = 1000;
    const random = yield* select(randomManager());
    const random2 = yield* select(randomManager([random.id]));

    yield* call(addEvent, {
      eventId,
      manager,
      duration,
      team: team.id,
      teamName: team.name,
      managerName: random.name,
      managerName2: random2.name,
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `Liigan huippujoukkue __${data.teamName}__ on törmännyt pelaajapolitiikallaan jäävuoreen! Tähtiä vilisevä mestariehdokas on muuttunut riitaisaksi muukalaislegioonaksi, jossa kaikki vihaavat kaikkia!

Manageri __${data.managerName}__ saa lähteä. Tilalle palkataan __${data.managerName2}__, mutta tilanne ei oletettavasti muutu mihinkään...`
    ];
  },

  process: function* (data) {
    const team = data.team;
    const duration = data.duration;
    yield* call(addEffect, team, ["strength"], -60, duration);
  }
};

export default event;
