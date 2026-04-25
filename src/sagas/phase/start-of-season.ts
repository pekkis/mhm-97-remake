import { take, put, call, race } from "typed-redux-saga";
import { seasonStart } from "@/sagas/game";
import { requestChampionBet } from "@/ducks/betting";
import { betChampion } from "@/sagas/betting";
import { advance, setGamePhase } from "@/ducks/game";

function* championshipBetting() {
  yield* put(setGamePhase("championship_betting"));

  const { bet } = yield* race({
    bet: take(requestChampionBet),
    advance: take(advance)
  });

  if (bet) {
    console.log("BET", bet);

    const { payload } = bet;
    yield* call(
      betChampion,
      payload.manager,
      payload.team,
      payload.amount,
      payload.odds
    );
  }
}

export default function* startOfSeasonPhase() {
  yield* call(seasonStart);
  yield* call(championshipBetting);
}
