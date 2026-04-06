import { take, call, select } from "redux-saga/effects";
import { GAME_ADVANCE_REQUEST } from "../../ducks/game";
import { setPhase } from "../game";
import { addNews } from "../news";
import { randomManager } from "../../data/selectors";

export default function* galaPhase() {
  yield call(setPhase, "gala");

  const teams = yield select((state) => state.game.teams);
  const managers = yield select((state) => state.manager.get("managers"));

  const phlRegularSeason = yield select((state) =>
    state.game.competitions.getIn(["phl", "phases", 0, "groups", 0])
  );

  const phlFinals = yield select((state) =>
    state.game.competitions.getIn(["phl", "phases", 3, "groups", 0])
  );

  const phlLast = teams[phlRegularSeason.get("stats").last().id];

  const phlFinalists = phlFinals
    .get("teams")
    .take(2)
    .map((t) => teams[t]);

  const phlBronzists = phlFinals
    .get("teams")
    .takeLast(2)
    .map((t) => teams[t]);

  const divFinals = yield select((state) =>
    state.game.competitions.getIn(["division", "phases", 3, "groups", 0])
  );

  const divFinalists = divFinals
    .get("teams")
    .take(2)
    .map((t) => teams[t]);

  const divRegularSeason = yield select((state) =>
    state.game.competitions.getIn(["division", "phases", 0, "groups", 0])
  );

  const otherManager = yield select(randomManager());

  yield call(
    addNews,
    `Ilmassa on jännitystä, finaalijoukkueet ovat viimein pitkän kauden jälkeen selvillä!`
  );

  yield call(
    addNews,
    `Kotiedun finaalisarjaan saa __${phlFinalists.first().name}__, ${
      phlFinalists.first().strength >=
      phlFinalists.last().strength
        ? `joka lähtee ennakkosuosikkina tuleviin otteluihin!`
        : `mutta joukkue lähteekin altavastaajana mukaan ja tarvitsee etua.`
    }`
  );

  const theManager = phlFinalists.last().manager
    ? managers.get(phlFinalists.last().manager)
    : otherManager;

  yield call(
    addNews,
    `Toinen loppuottelija on __${phlFinalists
      .last()
      .name}__, jonka manageri _${theManager.get(
      "name"
    )}_ on piiskannut hyvään vauhtiin kuluvalla kaudella.`
  );

  yield call(
    addNews,
    `Pronssitaistossa vastakkain ovat  __${phlBronzists
      .first()
      .name}__ ja __${phlBronzists
      .last()
      .name}__. Kolmannen sijan merkitystä ei pidä ollenkaan väheksyä, sillä tuohan se mukanaan paikan _europeleihin._`
  );

  if (
    phlRegularSeason
      .get("stats")
      .findIndex((stat) => stat.get("id") === phlBronzists.first()) === 0
  ) {
    yield call(
      addNews,
      `__${phlBronzists.first()}__ voitti runkosarjan, joten sille pronssiotteluun joutuminen on varmasti valtava pettymys.`
    );
  }

  if (
    phlRegularSeason
      .get("stats")
      .findIndex((stat) => stat.get("id") === phlBronzists.first().id) >=
    6
  ) {
    yield call(
      addNews,
      `__${phlBronzists
        .first()
        .get(
          "name"
        )}__ ylsi hikisesti play-offeihin, ja saa olla tyytyväinen pronssiottelupaikasta!`
    );
  }

  if (
    phlRegularSeason
      .get("stats")
      .findIndex((stat) => stat.get("id") === phlBronzists.last().id) >=
    6
  ) {
    yield call(
      addNews,
      `Runkosarjassa rämpinyt __${phlBronzists
        .last()
        .get(
          "name"
        )}__ on ollut yksi myöhäiskevään positiiviisimmista yllättäjistä!`
    );
  }

  yield call(
    addNews,
    `Nousukarsinnan finaalissa kohtaavat __${divFinalists
      .first()
      .name}__ ja __${divFinalists.last().name}__.`
  );

  if (phlRegularSeason.get("teams").includes(divFinalists.first().id)) {
    yield call(
      addNews,
      `__${divFinalists
        .first()
        .name}__ on läpikäynyt kovan kauden liigassa, ja voisi olettaa tämän kokemuksen antavan heille edun haastajaa vastaan.`
    );
  } else {
    yield call(
      addNews,
      `Liigassa pelannut __${phlLast.name}__ ei ole enää mukana nousukarsinnoissa. Kotiedun finaaliin saa siten __${divFinalists
        .first()
        .name}__`
    );
    yield call(
      addNews,
      `Liigaseuran semifinaalissa niputtanut __${divFinalists
        .last()
        .name}__ lähtee todella nälkäisenä finaaliin.`
    );
  }

  for (const divFinalist of divFinalists) {
    const ranking = divRegularSeason
      .get("stats")
      .findIndex((stat) => stat.get("id") === divFinalist.id);

    if (ranking === 0) {
      yield call(
        addNews,
        `Divisioonan runkosarjan voittanut __${divFinalist.name}__ katselee myös himokkaasti liigan suuntaan.`
      );
    }
  }

  for (const divFinalist of divFinalists) {
    const ranking = divRegularSeason
      .get("stats")
      .findIndex((stat) => stat.get("id") === divFinalist.id);

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
