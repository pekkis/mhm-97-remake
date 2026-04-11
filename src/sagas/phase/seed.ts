import { select, put, call } from "typed-redux-saga";
import calendar from "../../data/calendar";
import { seedCompetition } from "../game";
import { setGamePhase } from "../../ducks/game";
import type { RootState } from "../../config/redux";
import type { CompetitionId } from "@/types/competitions";

export default function* seedPhase() {
  console.log("SEED PHASE");

  yield* put(setGamePhase("seed"));

  const round = yield* select((state: RootState) => state.game.turn.round);
  const seeds = calendar[round].seed;

  if (seeds.length === 0) {
    return;
  }

  for (const seed of seeds) {
    const competitionId = seed.competition;
    const phaseId = seed.phase;
    yield* call(seedCompetition, competitionId as CompetitionId, phaseId);
  }
}
