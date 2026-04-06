import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { decrementStrength } from "../../sagas/team";
import { randomManager, randomTeamFrom } from "../selectors";
import type { MHMEvent } from "../../types/base";

const eventId = "makrosoft";

/*
sat41:
y = CINT(14 * RND) + 1
f = CINT(14 * RND) + 1
IF y = f THEN GOTO sat41
x = CINT(11 * RND) + 1
IF sarja = 1 AND x = u THEN GOTO sat41
PRINT l(x); ":n sponsori MAKROSOFT on mennyt konkurssiin. Velkojat ovat "
PRINT "joukkueen kimpussa, ja syntipukiksi leimataan manageri "; lm(y); "."
PRINT "H„n saa potkut, ja tilalle palkataan "; lm(f); "."
PRINT "Palkanmaksu viiv„styy, ja muutama joukkueen pelaaja siirtyy ulkomaille."
v(x) = v(x) - 20
RETURN
*/

type MakrosoftData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  oldManager: string;
  newManager: string;
  team: number;
  teamName: string;
  strengthLoss: number;
};

const event: MHMEvent<MakrosoftData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const oldManager = yield* select(randomManager());
    const newManager = yield* select(randomManager([oldManager.get("id")]));

    const team = yield* select(randomTeamFrom(["phl"]));

    yield* call(addEvent, {
      manager,
      eventId,
      oldManager: oldManager.get("name"),
      newManager: newManager.get("name"),
      team: team.id,
      teamName: team.name,
      strengthLoss: 20,
      resolved: true
    });
  },

  render: (data) => {
    return [
      `${data.teamName}:n sponsori __Makrosoft__ on mennyt konkurssiin. Velkojat ovat joukkueen kimpussa, ja syntipukiksi leimataan manageri ${data.oldManager}. Hän saa potkut, ja tilalle palkataan ${data.newManager}.

Palkanmaksu viivästyy, ja muutama joukkueen pelaaja siirtyy ulkomaille.`
    ];
  },

  process: function* (data) {
    const team = data.team;
    const strengthLoss = data.strengthLoss;
    yield* call(decrementStrength, team, strengthLoss);
  }
};

export default event;
