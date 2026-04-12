import { call, select } from "typed-redux-saga";
import { produce } from "immer";
import { addEvent, resolvedEvent } from "../../sagas/event";
import { addOpponentEffect } from "../../sagas/team";
import { managersTeamId, managerCompetesIn } from "../selectors";
import { amount as a } from "../../services/format";
import { incrementBalance } from "../../sagas/manager";
import type { MHMEvent } from "../../types/base";

const eventId = "pakibetteri";

type PakibetteriData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  amount: number;
  duration: number;
  agree?: boolean;
};

const event: MHMEvent<PakibetteriData> = {
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
      amount: 150000,
      resolved: false,
      duration: 6
    });
  },

  options: () => ({
    agree: "Suostun.",
    disagree: "En suostu."
  }),

  resolve: function* (data, value) {
    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      draft.agree = value === "agree";
    });

    yield* call(resolvedEvent, resolved);
  },

  render: (data) => {
    const lines = [
      `NHL-seura Florida Panthersin kykyjenetsijä ehdottaa: eestiläinen pakki Paki-Betteri Erg kiinnostaa heitä, mutta he haluavat ensin nähdä hänen taitonsa. Suostutko ottamaan Ergin joukkueeseen, kun Panthers maksaisi joukkueellenne ${data.duration} ottelun koeajasta ${a(data.amount)} pekkaa?`
    ];

    if (!data.resolved) {
      return lines;
    }

    if (!data.agree) {
      lines.push(`Paki-Betteri ei liity joukkueeseen.`);
    } else {
      lines.push(
        `Paki-Betteri liittyy joukkueeseen. Hänhän tuntuisi olevan oikein jykevä peruspuolustaja!`
      );
    }

    return lines;
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    const strength = -25;
    const amount = data.amount;
    const duration = data.duration;

    if (data.agree) {
      yield* call(incrementBalance, manager, amount);
      yield* call(addOpponentEffect, team, ["strength"], strength, duration);
    }
  }
};

export default event;
