import { call, select } from "typed-redux-saga";
import { produce } from "immer";
import { addEvent, resolvedEvent } from "../../sagas/event";
import { addOpponentEffect } from "../../sagas/team";
import { managersTeam } from "@/selectors";
import r from "../../services/random";
import type { MHMEvent } from "../../types/base";

const eventId = "metterer";

type MettererData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  strength: number;
  duration: number;
  agree?: boolean;
  positive?: boolean;
};

const event: MHMEvent<MettererData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      strength: 30,
      resolved: false,
      duration: 3
    });
  },

  options: () => ({
    agree: "Aina on tilaa yhdelle Karkukselle!",
    disagree: "Ei. Karkus pysyköön kotona."
  }),

  resolve: function* (data, value) {
    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      draft.agree = value === "agree";
      draft.positive = r.bool();
    });

    yield* call(resolvedEvent, resolved);
  },

  render: (data) => {
    const lines = [
      `Karkus Metterer, tunnettu maalivahti, haluaisi tulla joukkueeseesi pelaamaan 3 ottelun ajaksi kun Elitserienissä peliaikaa ei siunaannu. Otatko Karkuksen mukaan?`
    ];

    if (!data.agree) {
      lines.push(`Ei sitten.`);
    } else {
      lines.push(
        `Karkus on iloinen ja kiittelee kovasti. Miehen todellinen pelikunto selvinnee lähipäivinä.`
      );
    }

    return lines;
  },

  process: function* (data) {
    const manager = data.manager;
    const strength = data.strength;
    const duration = data.duration;
    const positive = data.positive;

    const effectSize = positive ? -strength : strength;

    const team = yield* select(managersTeam(manager));

    yield* call(addOpponentEffect, team.id, ["strength"], effectSize, duration);
  }
};

export default event;
