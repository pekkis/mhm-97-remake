import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { incrementMorale } from "../../sagas/team";
import { managersTeamId, managerById, totalGamesPlayed } from "../selectors";
import { cinteger } from "../../services/random";
import type { MHMEvent } from "../../types/base";

/*
sat88:
IF psmo < 400 THEN RETURN
PRINT "Kuuluisa kirjailija Seppo Kuningas hahmottelee uutta teosta"
teos = CINT(3 * RND) + 1
IF teos = 1 THEN teos$ = nimi$ + ":Legenda jo el„ess„„n!"
IF teos = 2 THEN teos$ = "Mestarimanagerin tarina"
IF teos = 3 THEN teos$ = "Managerikukkulan Kuningas"
IF teos = 4 THEN teos$ = "Kapina Hallilla"
PRINT "nimelt„„n '"; teos$; "' joka kertoo Sinun el„m„st„si!"
RETURN
*/

const bookNames: ((data: BookData) => string)[] = [
  (data) => `${data.managerName}: legenda jo eläessään`,
  () => `Mestarimanagerin tarina`,
  () => `Managerikukkulan kuningas`,
  () => `Kapina hallilla`
];

const eventId = "book";

type BookData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  managerName: string;
  book: number;
};

const event: MHMEvent<BookData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    const phlGamesPlayed = yield* select(totalGamesPlayed(manager, "phl", 0));
    if (!phlGamesPlayed || phlGamesPlayed < 400) {
      return;
    }

    const m = yield* select(managerById(manager));
    if (!m) {
      return;
    }

    const book = cinteger(0, 3);

    yield* call(addEvent, {
      eventId,
      manager,
      managerName: m.get("name"),
      book,
      resolved: true
    });
    return;
  },

  render: (data) => {
    return [
      `Kuuluisa kirjailija __Seppo Kuningas__ hahmottelee uutta teosta. "${bookNames[data.book](data)}" on kirjan nimi, ja se kertoo sinun elämästäsi!`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const team = yield* select(managersTeamId(manager));
    yield* call(incrementMorale, team, 2);
  }
};

export default event;
