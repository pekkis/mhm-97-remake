import { put, select, call } from "typed-redux-saga";
import { produce } from "immer";
import {
  managersTeamId,
  teamCompetesIn,
  flag,
  managerHasEnoughMoney,
  randomTeamFrom
} from "../selectors";
import { amount as a } from "../../services/format";
import { incrementMorale, incrementStrength } from "../../sagas/team";
import { addEvent } from "../../sagas/event";
import { decrementBalance } from "../../sagas/manager";
import { setFlag } from "../../sagas/game";
import type { MHMEvent } from "../../types/base";

const eventId = "jarko";

type JarkoData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  team: number;
  otherTeam: number;
  otherTeamName: string;
  enoughMoney: boolean;
  amount: number;
  strength: number;
  resolved: boolean;
  agree?: boolean;
};

const texts = (data: JarkoData): string[] => {
  const lines = [
    `NHL on ollut liian kova pala Jarko Mantuselle. Hän haluaisi palata kotimaahan, ja sinun joukkueeseesi. Myös __${data.otherTeamName}__ on kiinnostunut pelaajasta. Siirtosumma on pienehkö ${a(data.amount)}, ja pelaajan voima on ${data.strength}.`
  ];

  if (!data.resolved) {
    return lines;
  }

  if (!data.enoughMoney) {
    lines.push(`Rahatilanne ei anna mahdollisuutta ostaa Mantusta.`);
  }

  if (data.agree) {
    lines.push(`Hienoa! Joukkueellasi on uusi maalintekijä!`);
  } else {
    lines.push(`Mantusen uusi joukkue on ${data.otherTeamName}.`);
  }

  return lines;
};

const event: MHMEvent<JarkoData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;
    const jarkoFlag = yield* select(flag("jarko"));
    if (jarkoFlag) {
      return;
    }

    const team = yield* select(managersTeamId(manager));
    const otherTeam = yield* select(randomTeamFrom(["phl"], false));
    const playsInPHL = yield* select(teamCompetesIn(team, "phl"));
    if (!playsInPHL) {
      return;
    }

    const strength = 15;
    const amount = 200000;
    const enoughMoney = yield* select(managerHasEnoughMoney(manager, amount));

    yield* call(addEvent, {
      eventId,
      manager,
      team,
      otherTeam: otherTeam.id,
      otherTeamName: otherTeam.name,
      enoughMoney,
      amount,
      strength,
      resolved: !enoughMoney,
      agree: !enoughMoney ? false : undefined
    });
  },

  options: () => ({
    agree: "Ostan Mantusen joukkueeseeni",
    disagree: "En osta Mantusta joukkueeseeni"
  }),

  resolve: function* (data, value) {
    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      draft.agree = value === "agree";
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
    const team = data.team;
    const otherTeam = data.otherTeam;
    const amount = data.amount;
    const strength = data.strength;
    const agree = data.agree;

    if (agree) {
      yield* call(incrementStrength, team, strength);
      yield* call(incrementMorale, team, amount);
      yield* call(decrementBalance, manager, amount);
    } else {
      yield* call(incrementStrength, otherTeam, strength);
    }

    yield* call(setFlag, "jarko", true);
  }
};

export default event;
