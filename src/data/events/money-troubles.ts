import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { decrementStrength, incrementStrength } from "../../sagas/team";
import { randomTeamFrom, randomRankedTeam, randomManager } from "../selectors";
import { cinteger } from "../../services/random";
import type { MHMEvent } from "../../types/base";
import type { Team } from "@/ducks/game";

const eventId = "moneyTroubles";

type MoneyTroublesData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  otherManager: string;
  phlTeam: number;
  phlTeamName: string;
  divTeam: number;
  divTeamName: string;
  strengthTransfer: number;
};

const event: MHMEvent<MoneyTroublesData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const phlTeam = yield* select(randomRankedTeam("phl", 0, [9, 10, 11]));
    const divTeam = yield* select(
      randomTeamFrom(["division"], false, [], (t: Team) => t.strength > 95)
    );

    if (!phlTeam || !divTeam) {
      return;
    }

    const random = yield* select(randomManager());

    yield* call(addEvent, {
      eventId,
      manager,
      otherManager: random.get("name"),
      phlTeam: phlTeam.id,
      phlTeamName: phlTeam.name,
      divTeam: divTeam.id,
      divTeamName: divTeam.name,
      strengthTransfer: cinteger(0, 15) + 12,
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `Divisioonasta:

Manageri ${data.otherManager} ja joukkueensa __${data.divTeamName}__ pistävät tuulemaan! He ostavat rahavaikeuksiin joutuneelta liigajoukkueelta (__${data.phlTeamName})__ heidän parhaat pelaajansa.`
    ];
  },

  process: function* (data) {
    const phlTeam = data.phlTeam;
    const divTeam = data.divTeam;
    const strengthTransfer = data.strengthTransfer;

    yield* call(decrementStrength, phlTeam, strengthTransfer);
    yield* call(incrementStrength, divTeam, strengthTransfer);
  }
};

export default event;

/*
sat67:
nnn = CINT(14 * RND) + 1
FOR xxx = 1 TO 12
IF s(xxx) > 9 AND xxx <> u THEN GOTO satt67
NEXT xxx
satt67:
FOR zzz = 1 TO 12
IF sd(zzz) < 6 AND vd(zzz) > 95 AND zzz <> u THEN GOTO sattt67
NEXT zzz
RETURN
sattt67:
PRINT "Divisioonasta:"
PRINT "Manageri "; lm(nnn); " ja joukkueensa "; ld(zzz)
PRINT "pist„v„t tuulemaan!! He ostavat rahavaikeuksiin joutuneelta"
PRINT "liigajoukkueelta ("; l(xxx); ") heid„n parhaat pelaajansa."
ggg = CINT(15 * RND) + 12
v(xxx) = v(xxx) - ggg
vd(zzz) = vd(zzz) + ggg
RETURN
*/
