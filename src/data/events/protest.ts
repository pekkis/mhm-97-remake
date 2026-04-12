import { select, put, call } from "typed-redux-saga";
import { produce } from "immer";
import { managersTeam } from "../selectors";
import r from "../../services/random";
import { addEvent } from "../../sagas/event";
import { incurPenalty } from "../../sagas/team";
import { resolveEventAction } from "../../ducks/event";
import type { MHMEvent } from "../../types/base";
import type { RootState } from "../../config/redux";
import type { PrankInstance } from "@/data/pranks";
import { entries } from "remeda";

const eventId = "protest";

type ProtestData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  victim: number;
  resolved: boolean;
  autoResolve: true;
  perpetrator?: number;
  perpetratorTeamName?: string;
  victimTeamName?: string;
  success?: boolean;
  penalty?: number;
};

const event: MHMEvent<ProtestData, PrankInstance> = {
  type: "manager",

  create: function* (data) {
    const { manager, victim } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      victim,
      resolved: false,
      autoResolve: true
    });
  },

  resolve: function* (data) {
    const perpetratorTeam = yield* select(managersTeam(data.manager));

    const victimTeam = yield* select(
      (state: RootState) => state.game.teams[data.victim]
    );

    const resolved = produce(data, (draft) => {
      draft.perpetrator = perpetratorTeam.id;
      draft.perpetratorTeamName = perpetratorTeam.name;
      draft.victimTeamName = victimTeam.name;
      draft.success = r.bool();
      draft.resolved = true;
      draft.penalty = -3;
    });

    yield* put(
      resolveEventAction({
        id: resolved.id,
        event: resolved
      })
    );
  },

  render: (data) => {
    const lines = [
      `Jääkiekkoliiton hallitus on juhlallisesti ynnä virallisesti kokoontunut ja käsitellyt protestisi mitä reiluimmassa ja tasapuolisimmassa hengessä. Päätös on lopullinen, eikä siitä voi valittaa.`
    ];

    if (data.success) {
      lines.push(
        `Argumenttisi todetaan päteviksi. __${data.victimTeamName}__ tuomitaan menettämään ${Math.abs(data.penalty!)} pistettä rangaistuksena väitetystä sääntörikkomuksesta.`
      );
    } else {
      lines.push(
        `Argumenttisi todetaan hölynpölyksi. __${data.perpetratorTeamName}__ tuomitaan menettämään ${Math.abs(data.penalty!)} pistettä rangaistuksena aiheettomasta syytöksestä.`
      );
    }

    return lines;
  },

  process: function* (data) {
    const penalty = data.penalty!;
    const success = data.success;

    const penalizedTeam = success ? data.victim : data.perpetrator!;

    const competitions = yield* select(
      (state: RootState) => state.game.competitions
    );

    const [competitionId, competition] = entries(competitions)
      .filter(([id]) => id !== "ehl")
      .find(([, c]) => c.teams.includes(penalizedTeam))!;

    const groupId = competition.phases[0].groups.findIndex((g) =>
      g.teams.includes(penalizedTeam)
    );

    yield* call(
      incurPenalty,
      competitionId,
      0,
      groupId,
      penalizedTeam,
      penalty
    );
  }
};

export default event;
