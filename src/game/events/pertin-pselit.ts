import { select, call } from "typed-redux-saga";
import { incrementMorale } from "@/sagas/team";
import { addEvent } from "@/sagas/event";
import { managersTeamId, managersDifficulty } from "@/selectors";
import type { MHMEvent } from "@/types/base";

const eventId = "pertinPselit";

/*
sat59:
PRINT "Pertin Pselit kutsuu sinut pselailemaan! Pseli menee kuitenkin todella"
IF vai < 5 THEN PRINT "pserseelleen, mutta Lastenklinikka saa jokatapauksessa rahaa."
IF vai < 5 THEN PRINT "Moraali nousee hyv„ntekev„isyystempauksen johdosta.": mo = mo + 4
IF vai = 5 THEN PRINT "pserseelleen, ja kun Pertti viel„ pimitt„„ kaikki rahat ja lehdist" repos-"
IF vai = 5 THEN PRINT "telee jutulla, moraali laskee!": mo = mo - 5
RETURN
*/

type PseliKind = "good" | "bad";

const pselit: Record<PseliKind, { text: string; moraleChange: number }> = {
  good: {
    text: `Pseli menee todella pserseelleen, mutta lastensairaala saa joka tapauksessa rahaa. Moraali nousee hyväntekeväisyystempauksen johdosta.`,
    moraleChange: 4
  },
  bad: {
    text: `Pseli menee todella pserseelleen, ja kun Pertti vielä pimittää kaikki rahat ja lehdistökin repostelee jutulla, moraali laskee.`,
    moraleChange: -4
  }
};

type PertinPselitData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  pseli: PseliKind;
};

const event: MHMEvent<PertinPselitData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const difficulty = yield* select(managersDifficulty(manager));

    const pseli: PseliKind = difficulty < 4 ? "good" : "bad";

    yield* call(addEvent, {
      eventId,
      manager,
      pseli,
      resolved: true
    });
  },

  render: (data) => {
    const t = [`__Pertin Pselit__ kutsuu sinut pselailemaan!`];

    const pseliText = pselit[data.pseli].text;
    t.push(pseliText);
    return t;
  },

  process: function* (data) {
    const team = yield* select(managersTeamId(data.manager));

    yield* call(incrementMorale, team, pselit[data.pseli].moraleChange);
  }
};

export default event;
