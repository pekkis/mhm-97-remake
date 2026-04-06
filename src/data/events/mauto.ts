import { put, select, call } from "typed-redux-saga";
import { produce } from "immer";
import r from "../../services/random";
import {
  managerCompetesIn,
  flag,
  randomTeamFrom,
  managersTeam,
  managersDifficulty
} from "../selectors";
import { addEvent } from "../../sagas/event";
import { incrementBalance } from "../../sagas/manager";
import { incrementStrength } from "../../sagas/team";
import { setFlag } from "../../sagas/game";
import type { MHMEvent } from "../../types/base";

const eventId = "mauto";

type MautoData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  newName: string;
  resolved: boolean;
  amount: number;
  changeOfMind?: boolean;
  agree?: boolean;
  team?: string;
  teamName?: string;
};

const texts = (data: MautoData): string[] => {
  const lines = [
    `Monikansallinen autotehdas __Mautomobiles__ haluaa sponsoroida joukkuettasi!
    Jos joukkueen nimeksi vaihdetaan _${data.newName}_, rahoittavat he toimintaanne ${data.amount} pekalla! Suostutko?`
  ];

  if (!data.resolved) {
    return lines;
  }

  if (data.changeOfMind) {
    return [
      ...lines,
      `Mauto muuttaa yhtäkkiä mielipidettään ja sponsoroikin toista joukkuetta (__${data.teamName}__).`
    ];
  }

  if (!data.agree) {
    return [
      ...lines,
      `Mautomobiles sponsoroi joukkuetta __${data.teamName}__.`
    ];
  }

  return [
    ...lines,
    `Mautomobilesin toimitusjohtaja hymyilee kuin Naantalin aurinko. "Olkoon alkava yhteistyömme pitkä ja menestyksekäs!"`
  ];
};

const event: MHMEvent<MautoData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const competesInPHL = yield* select(managerCompetesIn(manager, "phl"));
    if (!competesInPHL) {
      return;
    }

    const hasHappened = yield* select(flag("mauto"));
    if (hasHappened) {
      return;
    }

    yield* call(addEvent, {
      eventId,
      manager,
      newName: "Mauto HT",
      resolved: false,
      amount: 4000000
    });
    return;
  },

  options: (data) => {
    return {
      y: `Suostun. Kauan eläköön ${data.newName} `,
      n: "En suostu. Pitäköön mautonsa!"
    } as any;
  },

  resolve: function* (data, value) {
    const manager = data.manager;
    const difficulty = yield* select(managersDifficulty(manager));

    let team: any;
    if (value === "n") {
      team = yield* select(randomTeamFrom(["phl", "division"], false));
    } else if (value === "y" && difficulty >= 3) {
      team = yield* select(randomTeamFrom(["phl", "division"], false));
    } else {
      team = yield* select(managersTeam(manager));
    }

    const resolved = produce(data, (draft) => {
      draft.changeOfMind = value === "y" && difficulty >= 3;
      draft.agree = value === "y";
      draft.team = team.id;
      draft.teamName = team.name;
      draft.resolved = true;
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
    yield* call(setFlag, "mauto", true);

    yield* put({
      type: "TEAM_RENAME",
      payload: {
        team: data.team,
        name: data.newName
      }
    });

    if (!data.agree || data.changeOfMind) {
      yield* call(incrementStrength, data.team!, 40);
    } else {
      yield* call(incrementBalance, data.manager, data.amount);

      yield* put({
        type: "MANAGER_RENAME_ARENA",
        payload: {
          manager: data.manager,
          name: "Mauto Center"
        }
      });
    }
  }
};

export default event;
