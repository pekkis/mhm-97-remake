import { select, call, put, take } from "typed-redux-saga";
import { gameday } from "../gameday";
import calendar from "../../data/calendar";
import { setPhase } from "../game";
import { advance, setGamePhase } from "../../ducks/game";
import type { RootState } from "../../config/redux";

export default function* gamedayPhase() {
  yield* call(setPhase, "gameday");

  const round = yield* select((state: RootState) => state.game.turn.round);

  const calendarEntry = calendar[round];
  const gamedays = calendarEntry.gamedays;

  yield* take(advance);

  for (const item of gamedays) {
    yield* call(gameday, item);
  }

  yield* put(setGamePhase("results"));

  yield* take(advance);
}
