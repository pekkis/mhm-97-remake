import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { incrementReadiness } from "../../sagas/team";
import { managersTeamId, managersTeam } from "../selectors";
import type { MHMEvent } from "../../types/base";

/*
sat90:
IF jursi = 0 THEN RETURN
PRINT "Pelaajasi ovat edell„ aikatauluaan! Vaikka kunto onkin ajoitettu"
PRINT "play-offeihin, pelaavat he jo nyt kuin hurmiossa!"
tre = tre + 6: RETURN
*/

const eventId = "simonovSuccess";

type SimonovSuccessData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
};

const event: MHMEvent<SimonovSuccessData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(managersTeam(manager));
    if (team.get("strategy") !== 0) {
      return;
    }

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true,
    });
    return;
  },

  render: (data) => {
    return [
      `Pelaajasi ovat edellä suunniteltua aikataulua. Vaikka "Juri Simonov"-strategian ansiosta  kuntohuippunne onkin ajoitettu play-offeihin, pelaavat "pojat" jo nyt kuin huomista ei olisi. Sinulla on hyvä syy odottaa tilanteen ainoastaan paranevan kohti kevättä!`,
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    yield* call(incrementReadiness, team, 6);
  },
};

export default event;
