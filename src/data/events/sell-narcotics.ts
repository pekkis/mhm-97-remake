import { select, put, call } from "typed-redux-saga";
import { produce } from "immer";
import { teamCompetesIn } from "../selectors";
import r, { cinteger } from "../../services/random";
import { decrementStrength } from "../../sagas/team";
import { decrementBalance } from "../../sagas/manager";
import { amount as a } from "../../services/format";
import { addEvent } from "../../sagas/event";
import { resolveEventAction } from "../../ducks/event";
import type { MHMEvent } from "../../types/base";
import type { RootState } from "../../config/redux";

const eventId = "sellNarcotics";

type SellNarcoticsData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  victim: number;
  resolved: boolean;
  autoResolve: true;
  skillLost?: number;
  fine?: number;
  victimTeamName?: string;
  caught?: boolean;
};

/*
huume:
raha = raha - 150000
IF sarja = 1 THEN PRINT "Hah Hah Haa! "; l(jj); ":n t„htipelaaja j„„ kiinni ja KUOLEE yliannostukseen!"
IF sarja = 2 THEN PRINT "Hah Hah Haa! "; ld(jj); ":n pelaaja j„„ kiinni ja KUOLEE yliannostukseen!"
IF sarja = 1 THEN v(jj) = v(jj) - CINT(25 * RND) + 1
IF sarja = 2 THEN vd(jj) = vd(jj) - CINT(12 * RND) + 1
IF sarja = 1 AND 100 * RND > 70 THEN PRINT "Mutta voi! Diilerikin napataan ja joudut pulittamaan miliisille rahaa!": PRINT "He veloittavat 200000 pekkaa!": raha = raha - 200000
IF sarja = 2 AND 100 * RND > 70 THEN PRINT "Mutta voi! Diilerikin napataan ja joudut pulittamaan miliisille rahaa!": PRINT "He veloittavat 60000 pekkaa!": raha = raha - 60000
INPUT yucca$
proz = proz + 1
*/

const event: MHMEvent<SellNarcoticsData> = {
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
    const victimTeam = yield* select(
      (state: RootState) => state.game.teams[data.victim]
    );

    const victimPlaysInPHL = yield* select(
      teamCompetesIn(data.victim as any, "phl")
    );

    const skillLost = victimPlaysInPHL
      ? cinteger(0, 25) + 1
      : cinteger(0, 12) + 1;
    const fine = victimPlaysInPHL ? 200000 : 60000;

    const resolved = produce(data, (draft) => {
      draft.skillLost = skillLost;
      draft.fine = fine;
      draft.victimTeamName = victimTeam.name;
      draft.caught = r.bool(0.7);
      draft.resolved = true;
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
      `Voi ei! __${data.victimTeamName}__ on kohdannut suuren tragedian. Joukkueen tähtipelaaja on löytynyt kotoaan kuolleena. Miliisi ei tiedota tapahtumista, mutta huhut väittävät syyksi tuntemattoman muuntohuumeen yliannostusta.`
    ];

    if (data.caught) {
      lines.push(
        `Vaikka miliisi ei julkisesti tapahtumista puhukaan, sinulle he kyllä soittavat. On tapahtunut "pikku kämmi", ja tarvitaan lisävoitelua. Joudut pulittamaan ylimääräiset __${a(data.fine!)}__ pekkaa. Ystäväsi Jaarnio pahoittelee suuresti.`
      );
    }

    return lines;
  },

  process: function* (data) {
    yield* call(decrementStrength, data.victim, data.skillLost!);

    if (data.caught) {
      yield* call(decrementBalance, data.manager, data.fine!);
    }
  }
};

export default event;
