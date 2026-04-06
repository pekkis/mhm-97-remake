import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { incrementReadiness } from "../../sagas/team";
import { managersTeamId, managersTeam } from "../selectors";
import type { MHMEvent } from "../../types/base";

/*
sat89:
IF allgo = 0 THEN RETURN
PRINT "Pelaajiesi kunto on osoittautunut odotettuakin paremmaksi!"
PRINT "Kuluttavasta pelaamisesta huolimatta he treenaavat entist„kin"
PRINT "kovemmin ja t„m„ n„kyy peliesityksiss„!"
tre = tre + 6: RETURN
*/

const eventId = "allgoSuccess";

type AllgoSuccessData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
};

const event: MHMEvent<AllgoSuccessData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(managersTeam(manager));
    if (team.get("strategy") !== 1) {
      return;
    }

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `Pelaajiesi kunto on osoittautunut odotettuakin paremmaksi! Kuluttavasta "kaikki peliin"-strategiastanne huolimatta "pojat" jaksavat yhä treenata entistäkin kovemmin, ja tämä näkyy toivottavasti peliesityksissä pitkälle kevääseen!`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    yield* call(incrementReadiness, team, 6);
  }
};

export default event;
