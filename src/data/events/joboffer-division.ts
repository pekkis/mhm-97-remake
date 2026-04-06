import { select, call, all } from "typed-redux-saga";
import { produce } from "immer";
import { randomTeamFrom, randomManager, managersTeamId } from "../selectors";
import { addEvent, resolvedEvent } from "../../sagas/event";
import {
  hireManager,
  setInsuranceExtra,
  setBalance,
  setArenaLevel,
  setService,
} from "../../sagas/manager";
import { setMorale, setReadiness, setStrategy } from "../../sagas/team";
import { cinteger } from "../../services/random";
import type { MHMEvent } from "../../types/base";

/*
PRINT ld(x); " tarjoaa sinulle ty"paikkaa!! Joukkue yritt„„ tosissaan nousua,"
PRINT "ja sill„ onkin uusi, todella mainio sponsorisopimus!"
PRINT "Sponsori kuitenkin vaatii "; nimi$; ":n managerikseen."
PRINT "otatko tarjouksen vastaan? (k/e)"
INPUT s$
IF s$ = "e" THEN PRINT "OK, ei sitten. Ty"h"n palkataan "; lm(y): RETURN
IF s$ = "k" THEN hallis: sarja = 2: u = x: raha = 2000000: hjalli = 2 + h: pt = 0: pv = 0: mo = 20: tre = 0: jursi = 0: allgo = 0: rally = 0: molce = 0: cheer = 0: veikko = 0: mikki = 0: palo = 0: euro = 0: RETURN*/

const eventId = "jobofferDivision";

type JobofferDivisionData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  oldTeam: string;
  offerer: string;
  offererName: string;
  resolved: boolean;
  agree?: boolean;
  otherManager?: string;
};

const event: MHMEvent<JobofferDivisionData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const oldTeam = yield* select(managersTeamId(manager));

    const offerer = yield* select(randomTeamFrom(["division"], false));
    yield* call(addEvent, {
      eventId,
      manager,
      oldTeam,
      offerer: offerer.get("id"),
      offererName: offerer.get("name"),
      resolved: false,
    });
  },

  options: () => {
    return {
      agree: `Kyllä otan!`,
      disagree: "En ota. Minun on hyvä täällä.",
    } as any;
  },

  resolve: function* (data, value) {
    let otherManagerName: string | undefined;

    if (value !== "agree") {
      const otherManager = yield* select(randomManager());
      otherManagerName = otherManager.get("name");
    }

    const resolved = produce(data, (draft) => {
      draft.resolved = true;
      draft.agree = value === "agree";
      if (otherManagerName) {
        draft.otherManager = otherManagerName;
      }
    });

    yield* call(resolvedEvent, resolved);
  },

  render: (data) => {
    const lines = [
      `__${data.offererName}__ tarjoaa sinulle työpaikkaa!! Joukkue yrittää tosissaan nousua liigaan, ja sillä onkin uusi, todella mainio sponsorisopimus! Sponsori kuitenkin vaatii nimenomaisesti sinut manageriksi. Otatko tarjouksen vastaan?`,
    ];

    if (!data.resolved) {
      return lines;
    }

    if (data.agree) {
      lines.push(
        `Katselet ympärillesi viimeistä kertaa. Tämä paikka on _niiiiin_ nähty.`,
      );
    } else {
      lines.push(
        `OK, ei sitten. Tehtävään palkataan __${data.otherManager}__.`,
      );
    }

    return lines;
  },

  process: function* (data) {
    const manager = data.manager;
    const offerer = data.offerer;
    const oldTeam = data.oldTeam;

    if (data.agree) {
      yield* all([
        call(hireManager, manager, offerer),
        call(setBalance, manager, 2000000),
        ...["coach", "cheer", "insurance", "microphone"].map((s) =>
          call(setService, manager, s, false),
        ),
        call(setArenaLevel, manager, 2 + cinteger(0, 2)),
        call(setInsuranceExtra, manager, 0),

        call(setMorale, oldTeam, 0),
        call(setMorale, offerer, 100),
        call(setStrategy, oldTeam, 2),
        call(setReadiness, oldTeam, 0),
      ]);
    }
  },
};

export default event;
