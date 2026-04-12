import { call, select } from "typed-redux-saga";
import { incrementMorale } from "@/sagas/team";
import { addEvent } from "@/sagas/event";
import { managersMainCompetition, managersTeamId } from "@/selectors";
import r from "@/services/random";
import type { MHMEvent } from "@/types/base";

const eventId = "ehlAward";

/*
IF edus1 = u THEN x = eds1
IF edus2 = u THEN x = eds2
IF edus3 = u THEN x = eds3
IF seh(x) = 1 THEN PRINT "Hurraa!! Voitimme!": raha = raha + 2000000: lemesm = leh(x)
IF seh(x) = 2 THEN PRINT "Hiphei!! Sijoituimme toiseksi!": raha = raha + 1600000
IF seh(x) = 3 THEN PRINT "Sijoituimme kolmanneksi!": raha = raha + 1400000
IF seh(x) = 4 THEN PRINT "Sijoituimme nelj„nneksi...": raha = raha + 1200000
IF seh(x) = 5 THEN PRINT "Sijoituimme viidenneksi...voi tukka!": raha = raha + 1000000
IF seh(x) = 6 THEN PRINT "™RRR! J„imme jumboiksi!": raha = raha + 800000
*/

type Prophecy = {
  prophecy: string;
  moraleChange: number;
};

type Prophecies = {
  [competition: string]: {
    [omen: string]: Prophecy;
  };
};

const prophecies: Prophecies = {
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

type EhlAwardData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  competition: string;
  omen: string;
};

const event: MHMEvent<EhlAwardData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const competition = yield* select(managersMainCompetition(manager));
    const omen = r.pick(["good", "bad"]);

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
