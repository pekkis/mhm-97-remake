import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { incrementReadiness } from "@/sagas/team";
import { managersTeamId } from "@/selectors";
import type { MHMEvent } from "@/types/base";

/*
sat92:
PRINT "Pelaajiesi kunto kohenee jostain syyst„ silmiss„! Kiekko liikkuu"
PRINT "kovalla sykkeell„ treeneiss„ ja peliesityksetkin kohenevat."
tre = tre + 3: RETURN
*/

const eventId = "strategySuccess";

type StrategySuccessData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
};

const event: MHMEvent<StrategySuccessData> = {
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
      `Pelaajiesi kunto kohenee jostain syystä silmissä! Kiekko liikkuu kovalla sykkeellä treeneissä ja peliesityksetkin kohenevat.`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    yield* call(incrementReadiness, team, 3);
  }
};

export default event;
