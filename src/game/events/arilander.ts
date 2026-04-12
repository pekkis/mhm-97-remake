import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { decrementMorale } from "@/sagas/team";
import { managersTeam, managersDifficulty, randomTeamFrom } from "@/selectors";
import type { MHMEvent } from "@/types/base";

const eventId = "arilander";

type ArilanderData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  moraleLoss: number;
  randomTeam: string;
};

const event: MHMEvent<ArilanderData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const difficulty = yield* select(managersDifficulty(manager));
    if (difficulty < 2) {
      return;
    }

    const moraleLoss = difficulty > 2 ? 16 : 10;

    const randomTeam = yield* select(
      randomTeamFrom(["phl", "division"], false)
    );

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true,
      moraleLoss,
      randomTeam: randomTeam.name
    });
    return;
  },

  render: (data) => {
    return [
      `__Sulo Arilander__ ${data.randomTeam}:sta väittää joutuneensa hyväksikäytetyksi juniorivuosinaan pelattuaan valmentamassasi joukkueessa, Jukureissa. Jotkut pelaajista alkavat hieman "vieroksua" sinua, ja päätäsi vaaditaan vadille!

Saat kuitenkin pitää paikkasi, koska todisteita ei ole.`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const moraleLoss = data.moraleLoss;

    const team = yield* select(managersTeam(manager));

    yield* call(decrementMorale, team.id, moraleLoss);
  }
};

/*
IF vai < 3 THEN RETURN
y = CINT(11 * RND) + 1
IF y = u THEN GOTO sat30
PRINT "Sulo Arilander "; l(y); ":st„ v„itt„„ joutuneensa hyv„ksik„ytetyksi"
PRINT "juniorivuosinaan pelattuaan valmentamassasi joukkueessa, Jukureissa."
PRINT "Jotkut pelaajista alkavat hieman 'vieroksua' sinua, ja p„„t„si vaaditaan"
PRINT "vadille! Saat kuitenkin pit„„ paikkasi, koska todisteita ei ole."
mo = mo - 10
IF vai = 4 THEN mo = mo - 6
*/

export default event;
