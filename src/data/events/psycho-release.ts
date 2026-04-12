import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { flag, randomTeamFrom } from "@/selectors";
import { cinteger } from "../../services/random";
import { setFlag } from "../../sagas/game";
import type { MHMEvent } from "../../types/base";
import type { RootState } from "../../config/redux";

/*
sat85:
IF assassi = 0 THEN RETURN
PRINT "Er„„n„ iltana ovikello soi. Avaat oven, ja sen takana seisoo"
PRINT "psykopaattimanageri "; lm(16); "!!"
satt85:
yyy = CINT(11 * RND) + 2
nnn = CINT(14 * RND) + 1
IF yyy = u AND sarja = 2 THEN GOTO satt85
PRINT "Mies on viimein vapautettu, ja saanut my"skin t"it„ divisioonasta!"
PRINT ld(yyy); " on palkannut h„net, ja mainostaa itse„„n"
PRINT "iskulauseella 'HULLUN HYVŽ MEININKI'!"
SWAP lm(nnn), lm(16): assassi = 0
RETURN
*/

const eventId = "psychoRelease";

type PsychoReleaseData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  otherManager: string;
  otherTeam: string;
  letter: number;
};

const event: MHMEvent<PsychoReleaseData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const psycho = yield* select(flag("psycho"));
    if (!psycho) {
      return;
    }

    const psychoManager = yield* select(
      (state: RootState) => state.game.managers[psycho]
    );

    const randomTeam = yield* select(randomTeamFrom(["division"]));

    yield* call(addEvent, {
      eventId,
      manager,
      otherManager: psychoManager.name,
      otherTeam: randomTeam.name,
      letter: cinteger(0, 4),
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `Eräänä iltana ovikello soi. Avaat oven, ja sen takana seisoo psykopaattimanageri __${data.otherManager}__!`,
      `Mies on viimein vapautettu Tiukukosken mielisairaalasta, ja hän on saanut myöskin töitä divisioonasta. __${data.otherTeam}__ on palkannut hänet, ja mainostaa nyt itseään iskulauseella "hullun hyvä meininki".`
    ];
  },

  process: function* (_data) {
    yield* call(setFlag, "psycho", undefined);
  }
};

export default event;
