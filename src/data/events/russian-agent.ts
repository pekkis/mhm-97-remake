import { put, select, call } from "typed-redux-saga";
import { produce } from "immer";
import { managersTeamId, teamCompetesIn } from "../selectors";
import { currency as c } from "../../services/format";
import { cinteger } from "../../services/random";
import { addEvent } from "../../sagas/event";
import { decrementBalance } from "../../sagas/manager";
import { incrementStrength } from "../../sagas/team";
import type { MHMEvent } from "../../types/base";

const eventId = "russianAgent";

type RussianAgentData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
  amount: number;
  agree?: boolean;
};

const texts = (data: RussianAgentData): string[] => {
  const lines = [
    `Venäjän agenttisi soittaa ja tarjoaa "huippupelaajaa" __Moskovan ZSKA__:sta. Et tiedä mitään hänen tasostaan, mutta toisaalta hintakin on vain ${c(data.amount)}. Päätös täytyy joka tapauksessa tehdä _heti_.`,
  ];

  if (!data.resolved) return lines;

  if (data.agree) {
    lines.push("Pelaaja saapuu seuraavalla vuorokoneella!");
  } else {
    lines.push("Pelaaja jää Moskovaan!");
  }
  return lines;
};

const event: MHMEvent<RussianAgentData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const team = yield* select(managersTeamId(manager));
    const playsInPHL = yield* select(teamCompetesIn(team, "phl"));
    if (!playsInPHL) return;

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 50000,
      resolved: false,
    });
  },

  options: () => {
    return {
      agree: `Ostan mysteeripelaajan`,
      disagree: `En osta mysteeripelaajaa`,
    } as any;
  },

  resolve: function* (data, value) {
    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      draft.agree = value === "agree";
    });

    yield* put({
      type: "EVENT_RESOLVE",
      payload: { id: resolved.id, event: resolved },
    });
  },

  render: (data) => {
    return texts(data);
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));

    if (!data.agree) return;

    const skillGained = cinteger(1, 11);
    yield* call(incrementStrength, team, skillGained);
    yield* call(decrementBalance, manager, data.amount);
  },
};

export default event;
