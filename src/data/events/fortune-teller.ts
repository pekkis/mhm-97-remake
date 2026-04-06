import { call, select } from "typed-redux-saga";
import { incrementMorale } from "../../sagas/team";
import { addEvent } from "../../sagas/event";
import { managersMainCompetition, managersTeamId } from "../selectors";
import r from "../../services/random";
import type { MHMEvent } from "../../types/base";

const eventId = "fortuneTeller";

type Omen = "good" | "bad";
type Competition = "phl" | "division";

const prophecies: Record<
  Competition,
  Record<Omen, { prophecy: string; moraleChange: number }>
> = {
  phl: {
    good: {
      prophecy: `Ennustajaeukko lupaa __kolmea__ peräkkäistä mestaruutta!`,
      moraleChange: 5
    },
    bad: {
      prophecy: `Ennustajaeukko lupaa pudotusta __divisioonaan__.`,
      moraleChange: -5
    }
  },
  division: {
    good: {
      prophecy: `Ennustajaeukko lupaa __liiganousua__.`,
      moraleChange: 5
    },
    bad: {
      prophecy: `Ennustajaeukko lupaa __vaikeita aikoja__.`,
      moraleChange: -5
    }
  }
};

/*
ddd = CINT(100 * RND)
IF sarja = 1 AND ddd < 50 THEN PRINT "Ennustajaeukko lupaa KOLMEA per„kk„ist„ mestaruutta!": mo = mo + 5
IF sarja = 2 AND ddd < 50 THEN PRINT "Ennustajaeukko lupaa LIIGANOUSUA!": mo = mo + 5
IF sarja = 1 AND ddd > 50 THEN PRINT "Ennustajaeukko lupaa pudotusta DIVISIOONAAN!": mo = mo + 5
IF sarja = 2 AND ddd > 50 THEN PRINT "Ennustajaeukko lupaa VAIKEITA AIKOJA!": mo = mo + 5
RETURN;
*/

type FortuneTellerData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  competition: Competition;
  omen: Omen;
};

const event: MHMEvent<FortuneTellerData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const competition = yield* select(managersMainCompetition(manager));
    const omen = r.pick(["good", "bad"]) as Omen;

    yield* call(addEvent, {
      eventId,
      manager,
      competition,
      omen,
      resolved: true
    });
  },

  render: (data) => {
    return [prophecies[data.competition][data.omen].prophecy];
  },

  process: function* (data) {
    const team = yield* select(managersTeamId(data.manager));

    yield* call(
      incrementMorale,
      team,
      prophecies[data.competition][data.omen].moraleChange
    );
  }
};

export default event;
