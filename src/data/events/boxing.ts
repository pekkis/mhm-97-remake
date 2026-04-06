import { select, call } from "typed-redux-saga";
import { produce } from "immer";
import { managersTeamId, randomManager } from "../selectors";
import { amount as a } from "../../services/format";
import { addEvent, resolvedEvent } from "../../sagas/event";
import { incrementMorale, decrementMorale } from "../../sagas/team";
import { decrementBalance } from "../../sagas/manager";
import { cinteger } from "../../services/random";
import type { MHMEvent } from "../../types/base";

const eventId = "boxing";

type BoxingData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  otherManager: string;
  resolved: boolean;
  amount?: number;
  agree?: boolean;
  result?: number | false;
};

const results = [
  {
    text: (_data: BoxingData) =>
      `Ottelu päättyy hienosti: tyrmäät vastustajasi!`,
    moraleGain: 10
  },
  {
    text: (_data: BoxingData) => `Ottelu päättyy hyväksesi tuomariäänin!`,
    moraleGain: 6
  },
  {
    text: (_data: BoxingData) => `Ottelu päättyy tasapeliin!`,
    moraleGain: 4
  },
  {
    text: (_data: BoxingData) => `Ottelu päättyy tappioosi tuomariäänillä!`,
    moraleGain: 3
  },
  {
    text: (data: BoxingData) =>
      `Ottelu päättyy, kun vastustajasi tyrmää sinut! Lääkärilasku kohoaa ${a(data.amount!)} pekkaan.`,
    moraleGain: 1
  }
];

const event: MHMEvent<BoxingData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const random = yield* select(randomManager());

    yield* call(addEvent, {
      eventId,
      manager,
      otherManager: random.get("name"),
      resolved: false
    });
  },

  options: () => {
    return {
      agree: `Otan haasteen vastaan. Nyrkkini on kova ja voittoni varma!`,
      disagree: `En ota haastetta vastaan. Aivoni ovat kovat, nyrkkini pehmeät.`
    } as any;
  },

  resolve: function* (data, value) {
    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      draft.amount = 10000;
      draft.agree = value === "agree";
      draft.result = value === "agree" ? cinteger(0, 4) : false;
    });

    yield* call(resolvedEvent, resolved);
  },

  render: (data) => {
    const lines = [
      `Manageri __${data.otherManager}__ haastaa sinut nyrkkeilyotteluun! Otatko haasteen vastaan?`
    ];

    if (!data.resolved) {
      return lines;
    }

    if (data.agree) {
      const text = results[data.result as number].text(data);
      lines.push(text);
    } else {
      lines.push(
        `Selvä. __${data.otherManager}__ haukkuu sinut julkisesti pelkuriksi ja _nörtiksi_!`
      );
    }

    return lines;
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));

    const resultId = data.result;

    if (data.agree) {
      const result = results[resultId as number];
      yield* call(incrementMorale, team, result.moraleGain);
      if (resultId === 4) {
        yield* call(decrementBalance, manager, data.amount!);
      }
    } else {
      yield* call(decrementMorale, team, 7);
    }
  }
};

export default event;
