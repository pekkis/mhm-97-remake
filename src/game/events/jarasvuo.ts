import { call, select } from "typed-redux-saga";
import { produce } from "immer";
import { addEvent, resolvedEvent } from "../../sagas/event";
import {
  decrementMorale,
  decrementStrength,
  incrementMorale,
  addEffect
} from "../../sagas/team";
import { managersTeamId, managerCompetesIn } from "@/selectors";
import { incrementBalance } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

const eventId = "jarasvuo";

type JarasvuoData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  solution?: "fine" | "ban" | "nothing";
};

const event: MHMEvent<JarasvuoData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;
    const competesInPHL = yield* select(managerCompetesIn(manager, "phl"));
    if (!competesInPHL) {
      return;
    }

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: false
    });
  },

  options: () => ({
    fine: "Annan sakon.",
    ban: "Annan kolme ottelua kurinpidollista pelikieltoa.",
    nothing: "En tee mitään. Pojat ovat poikia!"
  }),

  resolve: function* (data, value) {
    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      draft.solution = value as JarasvuoData["solution"];
    });

    yield* call(resolvedEvent, resolved);
  },

  render: (data) => {
    const lines = [
      `Huippupelaajanne on Sari Jarasvuon ohjelmassa haastattelussa. Hän ryöpyttää jostain syystä useita kanssapelaajiaan, valmentajaa ja koko organisaatiota. Kaikki saavat osansa.

Miten rankaiset pelaajaa?`
    ];

    if (!data.resolved) {
      return lines;
    }

    if (data.solution === "nothing") {
      lines.push(
        `Seuraus on KAPINA!!! Kaikki kaatuu päälle, johtokunta kokoontuu, pelaajat lopettavat protestina harjoittelun, fanit buuavat sinulle. Muutama pelaaja jopa lopettaa uransakin.`
      );
    }

    if (data.solution === "fine") {
      lines.push(`Pelaaja pyytää anteeksi.`);
    }

    if (data.solution === "ban") {
      lines.push(`Loistava tuomio, sanovat muut pelaajat.`);
    }

    return lines;
  },

  process: function* (data) {
    const manager = data.manager;
    const solution = data.solution;
    const team = yield* select(managersTeamId(manager));

    if (solution === "nothing") {
      yield* call(decrementMorale, team, 50);
      yield* call(decrementStrength, team, 18);
    }

    if (solution === "fine") {
      yield* call(incrementBalance, manager, 10000);
      yield* call(decrementMorale, team, 3);
    }

    if (solution === "ban") {
      yield* call(addEffect, team, ["strength"], -15, 3);
      yield* call(incrementMorale, team, 5);
    }
  }
};

export default event;
