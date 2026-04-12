import { call, select } from "typed-redux-saga";
import { managersTeam } from "@/selectors";
import { amount as a } from "@/services/format";
import { addEvent } from "@/sagas/event";
import { incrementBalance } from "@/sagas/manager";
import type { MHMEvent } from "@/types/base";

const eventId = "cleandrug";

type RallialaData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  team: number;
  teamName: string;
  amount: number;
};

const event: MHMEvent<RallialaData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(managersTeam(manager));

    yield* call(addEvent, {
      team: team.id,
      teamName: team.name,
      eventId,
      manager,
      resolved: true,
      amount: 70000
    });
  },

  render: (data) => {
    return [
      `Lavakoomikko __Aape Ralliala__ julistaa kääntyneensä ${data.teamName}:n kannattajaksi ja lahjoittaa sen osoitukseksi joukkueelle ${a(data.amount)} pekkaa.`
    ];
  },

  process: function* (data) {
    yield* call(incrementBalance, data.manager, data.amount);
  }
};

export default event;
