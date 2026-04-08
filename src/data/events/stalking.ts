import { call, select } from "typed-redux-saga";
import { managersTeamId, randomManager, managerCompetesIn } from "../selectors";
import { addEvent } from "../../sagas/event";
import { decrementMorale } from "../../sagas/team";
import type { MHMEvent } from "../../types/base";

const eventId = "stalking";

/*
sat17:
IF sarja = 2 THEN RETURN
x = CINT(14 * RND) + 1
PRINT "Manageri "; lm(x); " kytt„„ paikkaa joukkueessa."
PRINT "Mies tunnetaan tappavan raskaista harjoituksistaan ja pirullisuudestaan,"
PRINT "joten pelko romahduttaa moraalin vaikkei jutussa olekaan per„„!"
mo = mo - 40
*/

type StalkingData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  stalker: string;
};

const event: MHMEvent<StalkingData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const competesInPHL = yield* select(managerCompetesIn(manager, "phl"));
    if (!competesInPHL) {
      return;
    }

    const stalker = yield* select(randomManager());

    yield* call(addEvent, {
      eventId,
      manager,
      stalker: stalker.name,
      resolved: true
    });
  },

  render: (data) => {
    return [
      `Manageri __${data.stalker}__ kyttää paikkaa joukkueessa. Mies tunnetaan tappavan raskaista harjoituksistaan ja pirullisuudestaan, joten pelko romahduttaa moraalin vaikkei jutussa olekaan perää!`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));

    yield* call(decrementMorale, team, 10000);
  }
};

export default event;
