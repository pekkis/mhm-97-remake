import { select, call } from "typed-redux-saga";
import { randomManager } from "../selectors";
import { decrementStrength } from "../../sagas/team";
import { addEvent } from "../../sagas/event";
import type { MHMEvent } from "../../types/base";

const eventId = "bazookaStrike";

type BazookaStrikeData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  victim: number;
  victimTeamName: string;
  victimManager: string;
};

const event: MHMEvent<BazookaStrikeData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;
    const victim = (data as any).victim;

    const victimManager = yield* select(randomManager());

    const victimTeam = yield* select((state: any) => state.game.teams[victim]);

    yield* call(addEvent, {
      eventId,
      manager,
      victim,
      victimTeamName: victimTeam.name,
      victimManager: victimManager.name,
      resolved: true
    });
  },

  render: (data) => {
    return [
      `Pum! Matkalla vieraspeliin __${data.victimTeamName}__ kohtaa yllättäviä hankaluuksia. Silminnäkijäkuvauksen mukaan metsänrajasta sinkoutuu liikkeelle toisen ison kötinän aikainen panssarinyrkki, ja yks kaks tilausajon värjää punaiseksi liekkien kajo.

Iskun tekijäksi ilmoittautuu PVA. Miliisi ei kommentoi. Joukkue joutuu joka tapauksessa turvautumaan junioreihinsa, ja manageri __${data.victimManager}__ vannoo löytävänsä syylliset!`
    ];
  },

  process: function* (data) {
    const team = yield* select((state: any) => state.game.teams[data.victim]);

    const skillLost = Math.round(0.75 * team.strength);
    yield* call(decrementStrength, data.victim, skillLost);
  }
};

export default event;
