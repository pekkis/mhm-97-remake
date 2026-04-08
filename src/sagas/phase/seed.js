import { select, put, call } from "redux-saga/effects";
import calendar from "../../data/calendar";
import { seedCompetition } from "../game";

export default function* seedPhase() {
  console.log("SEED PHASE");

  yield put({
    type: "GAME_SET_PHASE",
    payload: "seed"
  });

  const round = yield select((state) => state.game.turn.round);
  const seeds = calendar[round].seed;

  console.log("SEEDS", seeds);

  if (seeds.length === 0) {
    return;
  }

  for (const seed of seeds) {
    const competitionId = seed.competition;
    const phaseId = seed.phase;
    yield call(seedCompetition, competitionId, phaseId);
  }
}
