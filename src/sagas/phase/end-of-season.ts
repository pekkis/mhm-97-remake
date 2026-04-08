import { call, all, take, put, select, putResolve } from "redux-saga/effects";
import { seasonStart, promote, relegate, setPhase } from "../game";
import { victors, eliminated } from "../../services/playoffs";
import awards from "../../data/awards";
import { cinteger } from "../../services/random";
import { setSeasonStat, createSeasonStories } from "../stats";
import { processChampionBets } from "../betting";
import { competition, allTeams } from "../../data/selectors";
import { setStrength, type Country } from "../../ducks/country";

const getLuck = () => {
  const isLucky = cinteger(1, 10);

  if (isLucky === 1) {
    return -(cinteger(0, 20) + 20);
  }

  if (isLucky === 10) {
    return cinteger(0, 20) + 20;
  }

  return 0;
};

function* definePekkalandiaStrength() {
  const phl = yield select(competition("phl"));
  const teams = yield select(allTeams);

  const avg = phl.teams
    .map((t: number) => teams[t].strength)
    .reduce((r: number, s: number) => r + s, 0);

  const strength = Math.round(avg / phl.teams.length);

  console.log("strength", strength);

  yield putResolve(setStrength("FI", strength));
}

function* worldChampionships() {
  yield call(setPhase, "world-championships");
  yield call(definePekkalandiaStrength);

  const countries: Record<string, Country> = yield select(
    (state) => state.country.countries
  );

  const rawEntries = Object.values(countries)
    .map((c) => ({
      id: c.iso,
      name: c.name,
      strength: c.strength,
      luck: getLuck(),
      random: cinteger(0, 20) - cinteger(0, 10)
    }))
    .sort(
      (a, b) =>
        (a.strength ?? 0) +
        a.luck +
        a.random -
        ((b.strength ?? 0) + b.luck + b.random)
    )
    .reverse();

  const entries = rawEntries;

  console.log(entries, "entries");

  yield put({
    type: "GAME_WORLD_CHAMPIONSHIP_RESULTS",
    payload: entries
  });

  yield call(
    setSeasonStat,
    ["worldChampionships"],
    entries.map((e) => e.id)
  );

  yield take("GAME_ADVANCE_REQUEST");
}

export default function* endOfSeasonPhase() {
  yield call(worldChampionships);

  yield call(setPhase, "end-of-season");

  yield call(awards);

  yield call(setPhase, "end-of-season");

  const division = yield select((state) => state.game.competitions.division);

  const phl = yield select((state) => state.game.competitions.phl);

  const divisionVictor = victors(division.phases[3].groups[0])[0].id;

  const presidentsTrophy = phl.phases[0].groups[0].stats[0].id;
  yield call(setSeasonStat, ["presidentsTrophy"], presidentsTrophy);

  const phlStats = phl.phases[0].groups[0].stats;
  const phlLoser = phlStats[phlStats.length - 1].id;

  const phlFinals = phl.phases[3].groups[0];
  const phlVictors = victors(phlFinals);
  const phlLosers = eliminated(phlFinals);

  const medalists = [
    phlVictors[0],
    phlLosers[0],
    phlVictors[phlVictors.length - 1]
  ].map((e) => e.id);

  yield call(setSeasonStat, ["medalists"], medalists);

  if (divisionVictor !== phlLoser) {
    yield call(setSeasonStat, ["relegated"], phlLoser);
    yield call(setSeasonStat, ["promoted"], divisionVictor);
  }

  yield call(processChampionBets);

  yield call(createSeasonStories);

  yield take("GAME_ADVANCE_REQUEST");

  yield put({
    type: "SEASON_END"
  });

  if (divisionVictor !== phlLoser) {
    yield all([promote("division", divisionVictor), relegate("phl", phlLoser)]);
  }

  yield call(seasonStart);
}
