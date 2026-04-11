import { select, call } from "typed-redux-saga";
import {
  competition,
  managerWhoControlsTeam,
  pekkalandianTeams,
  teamCompetesIn,
  teamsStrength,
  teamsPositionInRoundRobin,
  teamWasRelegated,
  teamWasPromoted
} from "./selectors";
import { victors, eliminated } from "../services/playoffs";
import r from "../services/random";
import { incrementStrength } from "../sagas/team";
import { incrementBalance } from "../sagas/manager";
import { addNews } from "../sagas/news";
import type { Team } from "../ducks/game";

type AwardData = {
  id: number;
  name: string;
  amount: number;
  strength: number;
};

type Award = {
  news: (data: AwardData) => string;
  data: (team: Team) => AwardData;
};

type RandomEvent = {
  id: number;
  (teamId: number): Generator;
};

const playsInPHLOrWasPromoted = function* (teamId: number) {
  const playsInPHL = yield* select(teamCompetesIn(teamId, "phl"));
  if (!playsInPHL) {
    return yield* select(teamWasPromoted(teamId));
  }

  const wasRelegated = yield* select(teamWasRelegated(teamId));
  return !wasRelegated;
};

const playsInDivisionOrWasRelegated = function* (teamId: number) {
  const playsInDivision = yield* select(teamCompetesIn(teamId, "division"));
  if (!playsInDivision) {
    return yield* select(teamWasRelegated(teamId));
  }

  const wasPromoted = yield* select(teamWasPromoted(teamId));
  return !wasPromoted;
};

const createRandom = (
  dieSize: number,
  requiredThrow: number,
  amountOfStrengthIncremented: (team: Team) => number,
  isEligible: (teamId: number) => Generator = function* () {
    return true;
  },
  news: (team: Team) => string
) => {
  return function* (teamId: number) {
    const team: Team = yield* select((state: any) => state.game.teams[teamId]);

    const canDo = yield* call(isEligible, teamId);

    if (!canDo) {
      return;
    }

    const rand = r.integer(1, dieSize);
    if (rand < requiredThrow) {
      return;
    }
    yield* call(incrementStrength, team.id, amountOfStrengthIncremented(team));
    yield* call(addNews, news(team));
  };
};

const randomEvents: RandomEvent[] = [
  createRandom(
    12,
    2,
    () => -199,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength > 400;
    },
    (team) => {
      return `__${team.name}__ kaatuu sisäisiin riitoihin! Pelaajat kävelevät ulos!`;
    }
  ),
  createRandom(
    12,
    5,
    () => -70,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength > 300;
    },
    (team) => {
      return `__${team.name}__ hajoaa totaalisesti ulkomaiden rahaseuroihin!`;
    }
  ),

  createRandom(
    12,
    6,
    () => -45,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength > 250;
    },
    (team) => {
      return `__${team.name}__ menettää useita pelaajiaan ulkomaille.`;
    }
  ),

  createRandom(
    12,
    8,
    () => -15,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength > 210;
    },
    (team) => {
      return `__${team.name}__ menettää joitakin pelaajiaan ulkomaille.`;
    }
  ),

  createRandom(
    1,
    1,
    () => -30,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      const rank = yield* select(teamsPositionInRoundRobin(teamId, "phl", 0));
      if (rank === false) {
        return false;
      }
      return strength > 200 && rank > 8;
    },
    (team) => {
      return `__${team.name}__ ei päässyt play-offeihin ja myy pelaajiaan konkurssin uhatessa!!`;
    }
  ),

  createRandom(
    1,
    1,
    () => 20,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      const rank = yield* select(teamsPositionInRoundRobin(teamId, "phl", 0));
      if (rank === false) {
        return;
      }

      return strength < 160 && rank <= 8;
    },
    (team) => {
      return `__${team.name}__:n  nuori joukkue saa rutkasti kokemusta play-offeista!`;
    }
  ),

  createRandom(
    12,
    5,
    () => 12,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength < 150;
    },
    (team) => {
      return `__${team.name}__ saa uuden sponsorin joka ostaa joukkueelle uusia pelaajia!`;
    }
  ),

  createRandom(
    12,
    5,
    () => 23,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength < 135;
    },
    (team) => {
      return `__${team.name}__ saa uuden, RIKKAAN sponsorin joka ostaa joukkueelle uusia pelaajia!`;
    }
  ),

  createRandom(
    22,
    16,
    () => 60,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength < 140;
    },
    (team) => {
      return `__${team.name}__ lähtee tosissaan mukaan mestaruustaistoon rahan voimalla!`;
    }
  ),

  createRandom(
    12,
    7,
    () => -10,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }

      return true;
    },
    (team) => {
      return `__${team.name}__:n veteraanipelaajia siirtyy eläkkeelle!`;
    }
  ),
  createRandom(
    12,
    7,
    () => 7,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }
      return true;
    },
    (team) => {
      return `__${team.name}__:n juniorityö tuottaa lupaavan nuoren tähden!`;
    }
  ),
  createRandom(
    12,
    8,
    () => -r.integer(5, 20),
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }
      return true;
    },
    (team) => {
      return `__${team.name}__:n pelaajia siirtyy rahan perässä muualle!`;
    }
  ),
  createRandom(
    12,
    8,
    () => -r.integer(5, 20),
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }
      return true;
    },
    (team) => {
      return `__${team.name}__ kokee menetyksen, pelaajia siirtyy pois!`;
    }
  ),
  createRandom(
    32,
    27,
    () => 55,
    function* (teamId: number) {
      const isEligible = yield* call(playsInPHLOrWasPromoted, teamId);
      if (!isEligible) {
        return false;
      }

      return true;
    },
    (team) => {
      return `__${team.name}__ antaa rahan palaa kunnolla!`;
    }
  ),

  createRandom(
    12,
    5,
    () => -40,
    function* (teamId: number) {
      const playsInPHL = yield* select(teamCompetesIn(teamId, "phl"));

      if (!playsInPHL) {
        return false;
      }

      const wasRelegated = yield* select(teamWasRelegated(teamId));
      if (!wasRelegated) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength > 160;
    },
    (team) => {
      return `Divisioonaan tippunut __${team.name}__ menettää rutkasti pelaajiansa liigaan.`;
    }
  ),
  createRandom(
    12,
    7,
    () => -20,
    function* (teamId: number) {
      const playsInPHL = yield* select(teamCompetesIn(teamId, "phl"));

      if (!playsInPHL) {
        return false;
      }

      const wasRelegated = yield* select(teamWasRelegated(teamId));
      if (!wasRelegated) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength > 130;
    },
    (team) => {
      return `Divisioonaan tippunut __${team.name}__ menettää pelaajiansa liigaan.`;
    }
  ),
  createRandom(
    1,
    1,
    () => -20,
    function* (teamId: number) {
      const playsInDivision = yield* select(teamCompetesIn(teamId, "division"));

      if (!playsInDivision) {
        return false;
      }

      const wasPromoted = yield* select(teamWasPromoted(teamId));
      if (wasPromoted) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength > 120;
    },
    (team) => {
      return `Nousua tavoitellut __${team.name}__ ei onnistunut - pelaajat lähtevät!.`;
    }
  ),
  createRandom(
    1,
    1,
    () => -40,
    function* (teamId: number) {
      const playsInDivision = yield* select(teamCompetesIn(teamId, "division"));

      if (!playsInDivision) {
        return false;
      }

      const wasPromoted = yield* select(teamWasPromoted(teamId));
      if (wasPromoted) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength > 140;
    },
    (team) => {
      return `Nousua tavoitellut __${team.name}__ ei onnistunut - pelaajat lähtevät joukoittain!.`;
    }
  ),
  createRandom(
    12,
    8,
    () => 8,
    function* (teamId: number) {
      const isEligible = yield* call(playsInDivisionOrWasRelegated, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength < 82;
    },
    (team) => {
      return `__${team.name}__ saa uuden sponsorin!.`;
    }
  ),
  createRandom(
    12,
    7,
    () => 13,
    function* (teamId: number) {
      const isEligible = yield* call(playsInDivisionOrWasRelegated, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength < 72;
    },
    (team) => {
      return `__${team.name}__ saa uuden, hyvän sponsorin!.`;
    }
  ),
  createRandom(
    12,
    7,
    () => 16,
    function* (teamId: number) {
      const isEligible = yield* call(playsInDivisionOrWasRelegated, teamId);
      if (!isEligible) {
        return false;
      }

      const strength = yield* select(teamsStrength(teamId));
      return strength < 62;
    },
    (team) => {
      return `__${team.name}__ saa uuden, loistavan sponsorin!.`;
    }
  ),
  createRandom(
    12,
    7,
    () => -15,
    function* (teamId: number) {
      const isEligible = yield* call(playsInDivisionOrWasRelegated, teamId);
      if (!isEligible) {
        return false;
      }

      return true;
    },
    (team) => {
      return `Liigajoukkueet värväävät __${team.name}__:n pelaajia!`;
    }
  ),
  createRandom(
    22,
    20,
    () => 45,
    function* (teamId: number) {
      const isEligible = yield* call(playsInDivisionOrWasRelegated, teamId);
      if (!isEligible) {
        return false;
      }

      return true;
    },
    (team) => {
      return `__${team.name}__ kuluttaa todella paljon rahaa! Uusia pelaajia ostetaan roimasti!`;
    }
  ),
  createRandom(
    12,
    7,
    () => -8,
    function* (teamId: number) {
      const isEligible = yield* call(playsInDivisionOrWasRelegated, teamId);
      if (!isEligible) {
        return false;
      }

      return true;
    },
    (team) => {
      return `__${team.name}__:n veteraanipelaajia lopettaa uransa.`;
    }
  ),
  createRandom(
    1,
    1,
    (team) => {
      return 45 - team.strength;
    },
    function* (teamId: number) {
      const strength = yield* select(teamsStrength(teamId));
      return strength < 35;
    },
    (team) => {
      return `__${team.name}__ on jo luopumassa sarjapaikastaan, mutta uusi omistaja pelastaa joukkueen viime hetkellä!`;
    }
  )
].map((fn, i) => {
  const event = fn as RandomEvent;
  event.id = i;
  return event;
});

const createAward = (
  amount: number,
  strength: number,
  news: (data: AwardData) => string
): Award => {
  return {
    news,
    data: (team) => ({
      id: team.id,
      name: team.name,
      amount,
      strength
    })
  };
};

const playoffBonusAward = createAward(100000, 2, (data) => {
  return `__${data.name}__ saa playoff-bonuksen, ${data.amount} pekkaa!`;
});

const medalAwards: Award[] = [
  createAward(1500000, 29, (data) => {
    return `__${data.name}__ nettoaa mestaruudestaan ${data.amount} pekkaa!`;
  }),
  createAward(1000000, 19, (data) => {
    return `__${data.name}__ nettoaa hopeastaan ${data.amount} pekkaa!`;
  }),
  createAward(700000, 12, (data) => {
    return `__${data.name}__ nettoaa pronssistaan ${data.amount} pekkaa!`;
  }),
  createAward(500000, 10, (data) => {
    return `__${data.name}__ nettoaa neljännestä sijastaan ${data.amount} pekkaa!`;
  })
];

const roundRobinAwards: Award[] = [
  createAward(500000, 10, (data) => {
    return `__${data.name}__ saa runkosarjan voitosta ${data.amount} pekkaa!`;
  }),
  createAward(400000, 7, (data) => {
    return `__${data.name}__ saa runkosarjan toisesta sijasta ${data.amount} pekkaa!`;
  }),
  createAward(300000, 6, (data) => {
    return `__${data.name}__ saa runkosarjan kolmannesta sijasta ${data.amount} pekkaa!`;
  }),
  createAward(200000, 4, (data) => {
    return `__${data.name}__ saa runkosarjan neljännestä sijasta ${data.amount} pekkaa!`;
  }),
  playoffBonusAward,
  playoffBonusAward,
  playoffBonusAward,
  playoffBonusAward
];

const yieldAwards = function* (awards: Award[], to: number[]) {
  const teams: Team[] = yield* select((state: any) => state.game.teams);

  for (const [i, teamId] of to.entries()) {
    const award = awards[i];
    const team = teams[teamId];

    const manager = yield* select(managerWhoControlsTeam(teamId));
    const data = award.data(team);

    if (manager) {
      yield* call(incrementBalance, manager.id, data.amount);
    } else {
      yield* call(incrementStrength, data.id, data.strength);
    }

    yield* call(addNews, award.news(data));
  }
};

const award = function* () {
  const phl = yield* select(competition("phl"));

  const finalPhase = phl.phases[3].groups[0];

  const winners = victors(finalPhase);
  const losers = eliminated(finalPhase);

  const ranking = [
    winners[0],
    losers[0],
    winners[winners.length - 1],
    losers[losers.length - 1]
  ].map((r) => r.id);

  yield* call(yieldAwards, medalAwards, ranking);

  const tableEntries = phl.phases[0].groups[0].stats
    .slice(0, 8)
    .map((t: any) => t.id);

  yield* call(yieldAwards, roundRobinAwards, tableEntries);
  const teams: Team[] = yield* select(pekkalandianTeams);

  for (const [, team] of teams.entries()) {
    for (const randomEvent of randomEvents) {
      yield* call(randomEvent, team.id);
    }
  }
};

export default award;
