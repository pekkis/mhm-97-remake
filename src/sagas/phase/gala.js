import { take, call, select } from "redux-saga/effects";
import { GAME_ADVANCE_REQUEST } from "../../ducks/game";
import { setPhase } from "../game";
import { addNews } from "../news";
import { randomManager } from "../../data/selectors";

export default function* galaPhase() {
  yield call(setPhase, "gala");

  const teams = yield select((state) => state.game.teams);
  const managers = yield select((state) => state.manager.managers);

  const phlRegularSeason = yield select(
    (state) => state.game.competitions.phl.phases[0].groups[0]
  );

  const phlFinals = yield select(
    (state) => state.game.competitions.phl.phases[3].groups[0]
  );

  const phlLast =
    teams[phlRegularSeason.stats[phlRegularSeason.stats.length - 1].id];

  const phlFinalists = phlFinals.teams.slice(0, 2).map((t) => teams[t]);

  const phlBronzists = phlFinals.teams.slice(-2).map((t) => teams[t]);

  const divFinals = yield select(
    (state) => state.game.competitions.division.phases[3].groups[0]
  );

  const divFinalists = divFinals.teams.slice(0, 2).map((t) => teams[t]);

  const divRegularSeason = yield select(
    (state) => state.game.competitions.division.phases[0].groups[0]
  );

  const otherManager = yield select(randomManager());

  yield call(
    addNews,
    `Ilmassa on jännitystä, finaalijoukkueet ovat viimein pitkän kauden jälkeen selvillä!`
  );

  yield call(
    addNews,
    `Kotiedun finaalisarjaan saa __${phlFinalists[0].name}__, ${
      phlFinalists[0].strength >= phlFinalists[phlFinalists.length - 1].strength
        ? `joka lähtee ennakkosuosikkina tuleviin otteluihin!`
        : `mutta joukkue lähteekin altavastaajana mukaan ja tarvitsee etua.`
    }`
  );

  const theManager = phlFinalists[phlFinalists.length - 1].manager
    ? managers[phlFinalists[phlFinalists.length - 1].manager]
    : otherManager;

  yield call(
    addNews,
    `Toinen loppuottelija on __${phlFinalists[phlFinalists.length - 1].name}__, jonka manageri _${theManager.name}_ on piiskannut hyvään vauhtiin kuluvalla kaudella.`
  );

  yield call(
    addNews,
    `Pronssitaistossa vastakkain ovat  __${phlBronzists[0].name}__ ja __${phlBronzists[phlBronzists.length - 1].name}__. Kolmannen sijan merkitystä ei pidä ollenkaan väheksyä, sillä tuohan se mukanaan paikan _europeleihin._`
  );

  if (
    phlRegularSeason.stats.findIndex(
      (stat) => stat.id === phlBronzists[0].id
    ) === 0
  ) {
    yield call(
      addNews,
      `__${phlBronzists[0].name}__ voitti runkosarjan, joten sille pronssiotteluun joutuminen on varmasti valtava pettymys.`
    );
  }

  if (
    phlRegularSeason.stats.findIndex(
      (stat) => stat.id === phlBronzists[0].id
    ) >= 6
  ) {
    yield call(
      addNews,
      `__${phlBronzists[0].name}__ ylsi hikisesti play-offeihin, ja saa olla tyytyväinen pronssiottelupaikasta!`
    );
  }

  if (
    phlRegularSeason.stats.findIndex(
      (stat) => stat.id === phlBronzists[phlBronzists.length - 1].id
    ) >= 6
  ) {
    yield call(
      addNews,
      `Runkosarjassa rämpinyt __${phlBronzists[phlBronzists.length - 1].name}__ on ollut yksi myöhäiskevään positiiviisimmista yllättäjistä!`
    );
  }

  yield call(
    addNews,
    `Nousukarsinnan finaalissa kohtaavat __${divFinalists[0].name}__ ja __${divFinalists[divFinalists.length - 1].name}__.`
  );

  if (phlRegularSeason.teams.includes(divFinalists[0].id)) {
    yield call(
      addNews,
      `__${divFinalists[0].name}__ on läpikäynyt kovan kauden liigassa, ja voisi olettaa tämän kokemuksen antavan heille edun haastajaa vastaan.`
    );
  } else {
    yield call(
      addNews,
      `Liigassa pelannut __${phlLast.name}__ ei ole enää mukana nousukarsinnoissa. Kotiedun finaaliin saa siten __${divFinalists[0].name}__`
    );
    yield call(
      addNews,
      `Liigaseuran semifinaalissa niputtanut __${divFinalists[divFinalists.length - 1].name}__ lähtee todella nälkäisenä finaaliin.`
    );
  }

  for (const divFinalist of divFinalists) {
    const ranking = divRegularSeason.stats.findIndex(
      (stat) => stat.id === divFinalist.id
    );

    if (ranking === 0) {
      yield call(
        addNews,
        `Divisioonan runkosarjan voittanut __${divFinalist.name}__ katselee myös himokkaasti liigan suuntaan.`
      );
    }
  }

  for (const divFinalist of divFinalists) {
    const ranking = divRegularSeason.stats.findIndex(
      (stat) => stat.id === divFinalist.id
    );

    if (ranking === 4) {
      yield call(
        addNews,
        `Divisioonassa kovin keskinkertaisesti pärjännyt __${divFinalist.name}__ on yllättänyt kaikki jyräämällä vastuttamattomasti tietänsä ylemmälle sarjatasolle.`
      );
    }

    if (ranking === 5) {
      yield call(
        addNews,
        `Viimeisenä divarin jatkopeleihin ponnistanut  __${divFinalist.name}__ on härän vimmalla raivannut vastustajansa pois alta. Miten käynee nyt?`
      );
    }
  }

  yield take(GAME_ADVANCE_REQUEST);
}
