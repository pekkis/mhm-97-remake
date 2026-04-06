import { put, select, call } from "typed-redux-saga";
import { produce } from "immer";
import {
  managersTeamId,
  randomTeamFrom,
  randomManager,
  managerHasService,
  managersDifficulty,
  managersArena
} from "../selectors";
import { currency as c, amount as a } from "../../services/format";
import r from "../../services/random";
import { decrementMorale } from "../../sagas/team";
import { addEvent } from "../../sagas/event";
import { decrementBalance, incrementInsuranceExtra } from "../../sagas/manager";
import { decrementStrength, incrementStrength } from "../../sagas/team";
import type { MHMEvent } from "../../types/base";

const eventId = "taxEvasion";

type TaxEvasionData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  amount: number;
  resolved: boolean;
  otherManager: string;
  otherManagerName: string;
  team: string;
  teamName: string;
  agree?: boolean;
  fine?: number;
  fine2?: number;
  caught?: boolean;
  hasInsurance?: boolean;
  getPlayer?: number;
};

const texts = (data: TaxEvasionData): string[] => {
  const lines = [
    `Olet saanut tietää, että __${data.teamName}__:n manageri __${data.otherManagerName}__ on kiertänyt veroja. Julkistatko tiedon, vaikka samalla on riski että omat vilppisi tulevat julkisuuteen? Tieto ajaisi todennäköisesti joukkueen konkurssiin.`
  ];

  if (!data.resolved) {
    return lines;
  }

  if (!data.agree) {
    return [
      ...lines,
      `OK. ${data.otherManagerName} saa siis jatkaa rikollista toimintaansa.`
    ];
  }

  if (data.caught) {
    lines.push(
      `Oi voi! Omat veronkiertosi paljastuvat, ja saat ${a(data.fine!)} pekan sakot!`
    );
    if (data.hasInsurance) {
      lines.push(
        `Vakuutuspetoksesikin tulevat ilmi, ja Etel„l„ sakottaa sinua ${a(data.fine2!)} pekalla!!!`
      );
    }
  } else {
    lines.push(
      `Haa haa. ${data.otherManagerName} joutuu kohtaamaan talousrikosmiliisin ypöyksin!`
    );
  }

  lines.push(
    `${data.teamName} saa kauheat mätkyt, ja huippupelaajat evakuoituvat uppoavasta laivasta!`
  );

  if (data.getPlayer) {
    lines.push(
      `Yksi heistä haluaa pelipaikan, jonka ystävällisesti annat (vain palkka maksettava)`
    );
  }

  return lines;
};

const event: MHMEvent<TaxEvasionData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const otherManager = yield* select(randomManager());
    const team = yield* select(randomTeamFrom(["phl"], false));

    yield* call(addEvent, {
      eventId,
      manager,
      amount: 50000,
      resolved: false,
      otherManager: otherManager.get("id"),
      otherManagerName: otherManager.get("name"),
      team: team.get("id"),
      teamName: team.get("name")
    });
  },

  options: () => {
    return {
      agree: `Paljastan vilpin.`,
      disagree: `En paljasta vilppiä.`
    } as any;
  },

  resolve: function* (data, value) {
    const manager = data.manager;

    const caught = r.bool();
    const hasInsurance = yield* select(managerHasService(manager, "insurance"));
    const difficulty = yield* select(managersDifficulty(manager));

    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      draft.agree = value === "agree";
      draft.fine = 1000000;
      draft.fine2 = 300000;
      draft.caught = caught;
      draft.hasInsurance = hasInsurance;
      if (difficulty < 3) {
        draft.getPlayer = 5;
      }
    });

    yield* put({
      type: "EVENT_RESOLVE",
      payload: {
        id: resolved.id,
        event: resolved
      }
    });
  },

  render: (data) => {
    return texts(data);
  },

  process: function* (data) {
    const manager = data.manager;
    const managersTeam = yield* select(managersTeamId(manager));

    if (!data.agree) {
      return;
    }

    yield* call(decrementStrength, data.team, 65);

    if (data.getPlayer) {
      yield* call(incrementStrength, managersTeam, data.getPlayer);
    }

    if (!data.caught) {
      return;
    }

    yield* call(decrementMorale, managersTeam, 6);
    yield* call(decrementBalance, manager, data.fine!);

    if (data.hasInsurance) {
      yield* call(decrementBalance, manager, data.fine2!);

      const arena = yield* select(managersArena(manager));
      yield* call(
        incrementInsuranceExtra,
        manager,
        200 * (arena.get("level") + 1)
      );
    }
  }
};

export default event;
