import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { decrementMorale } from "../../sagas/team";
import { managersTeamId, managersDifficulty } from "../selectors";
import type { MHMEvent } from "../../types/base";

/*
sat39:
PRINT "P-STUDIO tekee reportaasin joukkueenne veror„stien takia."
PRINT "Juttu on valetta, mutta se laskee moraalia kun pelaajat pelk„„v„t"
PRINT "palkanmaksun viiv„stymist„."
mo = mo - (1 + vai)
RETURN
*/

const eventId = "pstudio";

type PstudioData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  moraleLoss: number;
};

const event: MHMEvent<PstudioData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const difficulty = yield* select(managersDifficulty(manager));
    const moraleLoss = 2 + difficulty;

    yield* call(addEvent, {
      eventId,
      manager,
      moraleLoss,
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `__P-Studio__ tekee reportaasin joukkueenne verorästien takia. Juttu on valetta, mutta se laskee moraalia kun pelaajat pelkäävät palkanmaksun viivästymistä.`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const moraleLoss = data.moraleLoss;
    const team = yield* select(managersTeamId(manager));

    yield* call(decrementMorale, team, moraleLoss);
  }
};

export default event;
