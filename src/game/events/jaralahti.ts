import { put, select, all, call } from "typed-redux-saga";
import { produce } from "immer";
import { managersTeamId, teamCompetesIn, managerHasService } from "@/selectors";
import { amount as a } from "@/services/format";
import { addEvent } from "@/sagas/event";
import { incrementBalance, decrementBalance } from "@/sagas/manager";
import { decrementStrength, incrementStrength } from "@/sagas/team";
import type { MHMEvent } from "@/types/base";

const eventId = "jaralahti";

type JaralahtiData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  amount: number;
  support?: boolean;
  hasInsurance?: boolean;
};

const texts = (data: JaralahtiData): string[] => {
  const lines = [
    `Miliisi soittaa kotiisi yöllä. Tähtipuolustajasi __Kale Jaralahti__ on juuri narahtanut kaupungin keskustassa auton ratista huumepöllyssä.`
  ];

  if (!data.resolved) {
    return lines;
  }

  if (!data.support) {
    lines.push("Pelaaja katoaa lopullisesti aamuun mennessä!");
    if (data.hasInsurance) {
      lines.push(`Vakuutusyhtiö maksaa sinulle ${a(data.amount)}.`);
    }
    return lines;
  }

  lines.push(
    `Rahaa kuluu, mutta pelaaja on kiitollinen. Hän parantaa tasoansa (ja lupaa pyhästi parantaa tapansa)!`
  );
  return lines;
};

const event: MHMEvent<JaralahtiData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 75000,
      resolved: false
    });
  },

  options: (data) => {
    return {
      support: `Lahjoitan miliisien virkistysrahastoon ${a(data.amount)} pekkaa.`,
      nothing: "Lyön luurin korvaan ja sanoudun irti koko hommasta!"
    };
  },

  resolve: function* (data, value) {
    const hasInsurance = yield* select(
      managerHasService(data.manager, "insurance")
    );

    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      draft.support = value === "support";
      draft.hasInsurance = hasInsurance;
    });

    yield* put({
      type: "EVENT_RESOLVE",
      payload: { id: resolved.id, event: resolved }
    });
  },

  render: (data) => {
    return texts(data);
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));

    const competesInPHL = yield* select(teamCompetesIn(team, "phl"));
    const multiplier = competesInPHL ? 2 : 1;

    if (!data.support) {
      const skillLost = 7 * multiplier;
      yield* call(decrementStrength, team, skillLost);

      if (data.hasInsurance) {
        yield* call(incrementBalance, manager, data.amount);
      }
    } else {
      const skillGained = 4 * multiplier;
      yield* all([
        call(incrementStrength, team, skillGained),
        call(decrementBalance, manager, data.amount)
      ]);
    }
  }
};

export default event;
