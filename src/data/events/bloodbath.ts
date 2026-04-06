import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { decrementStrength } from "../../sagas/team";
import { randomManager, randomTeamFrom } from "../selectors";
import { cinteger } from "../../services/random";
import type { MHMEvent } from "../../types/base";

/*
sat87:
yyy = CINT(11 * RND) + 1
IF yyy = u AND sarja = 1 THEN GOTO sat87
satt87:
xxx = CINT(11 * RND) + 1
IF xxx = yyy THEN GOTO satt87
IF xxx = u AND sarja = 1 THEN GOTO satt87
PRINT l(yyy); ":n ja "; l(xxx); ":n pelaajat ovat ottaneet v„kivaltaisesti"
PRINT "yhteen! Miliisi l"yt„„ tappelupaikalta yhden molempien joukkueiden"
PRINT "pelaajista kuolleena sek„ verisen pensasleikkurin. Muita asian-"
PRINT "omaisia ei koskaan saada kiinni, koska kaikki kiist„v„t osallisuutensa"
PRINT "managerit "; lm(yyy); " ja "; lm(xxx); " mukaanlukien."
v(yyy) = v(yyy) - CINT(12 * RND) - 6
v(xxx) = v(xxx) - CINT(12 * RND) - 6
RETURN
*/

const eventId = "bloodbath";

type BloodbathData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  otherManager: string;
  otherManager2: string;
  team: number;
  team2: number;
  teamName: string;
  teamName2: string;
};

const event: MHMEvent<BloodbathData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const random = yield* select(randomManager());
    const random2 = yield* select(randomManager([random.get("id")]));

    const team = yield* select(randomTeamFrom(["phl"], false, []));
    const team2 = yield* select(randomTeamFrom(["phl"], false, [team.id]));

    yield* call(addEvent, {
      eventId,
      manager,
      otherManager: random.get("name"),
      otherManager2: random2.get("name"),
      team: team.id,
      team2: team2.id,
      teamName: team.name,
      teamName2: team2.name,
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `__${data.teamName}__:n ja __${data.teamName2}__:n pelaajat ovat ottaneet väkivaltaisesti yhteen! Miliisi löytää tappelupaikalta yhden molempien joukkueiden pelaajista kuolleena sekä verisen pensasleikkurin.

Muita asianomaisia ei koskaan saada kiinni. Kaikki kiistävät osallisuutensa, managerit __${data.otherManager}__ ja __${data.otherManager2}__ mukaanlukien."`
    ];
  },

  process: function* (data) {
    const team = data.team;
    const team2 = data.team2;

    for (const teamId of [team, team2]) {
      yield* call(decrementStrength, teamId, cinteger(0, 12) + 6);
    }
  }
};

export default event;
