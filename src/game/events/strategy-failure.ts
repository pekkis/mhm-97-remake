import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { incrementReadiness } from "../../sagas/team";
import { managersTeamId } from "@/selectors";
import type { MHMEvent } from "../../types/base";

/*
sat91:
PRINT "Pelaajasi v„syv„t kovaa vauhtia! Heid„n kuntopohjansa ei yksinkertaisesti"
PRINT "ole kest„nyt kiivasta ottelurytmi„."
tre = tre - 3: RETURN
*/

const eventId = "strategyFailure";

type StrategyFailureData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
};

const event: MHMEvent<StrategyFailureData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true
    });
    return;
  },

  render: () => {
    return [
      `Pelaajasi väsyvät kovaa vauhtia! Heidän kuntopohjansa ei yksinkertaisesti ole kestänyt kiivasta ottelurytmiä.`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    yield* call(incrementReadiness, team, -3);
  }
};

export default event;
