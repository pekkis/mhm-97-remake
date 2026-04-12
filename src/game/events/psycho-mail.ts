import { call, select } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import { flag } from "@/selectors";
import { cinteger } from "@/services/random";
import type { MHMEvent } from "@/types/base";
import type { RootState } from "@/config/redux";

/*
sat84:
IF assassi = 0 THEN RETURN
PRINT "Manageri "; lm(16); " l„hett„„ sinulle Tiukukoskelta kirjeen,"
yyy = CINT(5 * RND) + 1
IF yyy = 1 THEN PRINT "jossa h„n vannoo kostoa !"
IF yyy = 2 THEN PRINT "jossa h„n varoittaa sinua avaruusolentojen hy"kk„yksest„."
IF yyy = 3 THEN PRINT "jossa h„n pyyt„„ anteeksi ja kertoo psykoanalyysist„„n."
IF yyy = 4 THEN PRINT "jossa h„n kertoo olevansa koko sairaalan paras j„„kiekkomanageri."
IF yyy = 5 THEN PRINT "josta ei saa mit„„n tolkkua."
IF yyy = 6 THEN PRINT "jonka h„nelle ovat sanelleet 'Toni Tiikeri' ja 'Eetu Elefantti'"
RETURN
*/

const letters = [
  (data: PsychoMailData) =>
    `__${data.otherManager}__ lähettää sinulle Tiukukoskelta kirjeen, jossa vannoo kostoa!`,
  (data: PsychoMailData) =>
    `__${data.otherManager}__ lähettää sinulle Tiukukoskelta kirjeen, jossa hän varoittaa sinua avaruusolentojen hyökkäyksestä.`,
  (data: PsychoMailData) =>
    `__${data.otherManager}__ lähettää sinulle Tiukukoskelta kirjeen, jossa hän kertoo olevansa koko sairaalan paras jääkiekkomanageri.`,
  (data: PsychoMailData) =>
    `__${data.otherManager}__ lähettää sinulle Tiukukoskelta kirjeen, josta et ota mitään tolkkua.`,
  (data: PsychoMailData) =>
    `__${data.otherManager}__ lähettää sinulle Tiukukoskelta kirjeen, jonka hänelle "ovat sanelleet Sami Sammakko, Toni Tiikeri ja Ossi Olifantti".`
];

const eventId = "psychoMail";

type PsychoMailData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  otherManager: string;
  letter: number;
};

const event: MHMEvent<PsychoMailData> = {
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

    yield* call(addEvent, {
      eventId,
      manager,
      otherManager: psychoManager.name,
      letter: cinteger(0, 4),
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [letters[data.letter](data)];
  },

  process: function* (_data) {}
};

export default event;
