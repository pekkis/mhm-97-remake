import { select, putResolve, call } from "typed-redux-saga";
import { produce } from "immer";
import { managersTeam } from "../selectors";
import r from "../../services/random";
import { addEvent } from "../../sagas/event";
import { incurPenalty } from "../../sagas/team";
import type { MHMEvent } from "../../types/base";

const eventId = "protest";

type ProtestData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  victim: string;
  resolved: boolean;
  autoResolve: true;
  perpetrator?: string;
  perpetratorTeamName?: string;
  victimTeamName?: string;
  success?: boolean;
  penalty?: number;
};

const event: MHMEvent<ProtestData> = {
  type: "manager",

  create: function* (data: any) {
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
    console.log("FUCKEN RESOLVER?!?!?!?");

    const perpetratorTeam = yield* select(managersTeam(data.manager));

    const victimTeam = yield* select((state: any) =>
      state.game.getIn(["teams", data.victim])
    );

    const resolved = produce(data, (draft) => {
      draft.perpetrator = perpetratorTeam.get("id");
      draft.perpetratorTeamName = perpetratorTeam.get("name");
      draft.victimTeamName = victimTeam.get("name");
      draft.success = r.bool();
      draft.resolved = true;
      draft.penalty = -3;
    });

    yield* putResolve({
      type: "EVENT_RESOLVE",
      payload: {
        id: resolved.id,
        event: resolved
      }
    });
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

    const competitions = yield* select((state: any) =>
      state.game.get("competitions")
    );

    const competition = competitions
      .filterNot((c: any) => c.get("id") === "ehl")
      .find((c: any) => c.get("teams").includes(penalizedTeam));

    const groupId = competition
      .getIn(["phases", 0, "groups"])
      .findIndex((g: any) => g.get("teams").includes(penalizedTeam));

    yield* call(
      incurPenalty,
      competition.get("id"),
      0,
      groupId,
      penalizedTeam,
      penalty
    );
  }
};

export default event;
