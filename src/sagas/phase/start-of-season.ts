import { take, put, select, call, all, race } from "typed-redux-saga";
import { seasonStart } from "@/sagas/game";
import strategies from "@/data/strategies";
import { requestChampionBet } from "@/ducks/betting";
import { betChampion } from "@/sagas/betting";
import { setActiveManager } from "@/sagas/manager";
import { managerSelectStrategy } from "@/ducks/manager";
import {
  advance,
  setGamePhase,
  teamSetStrategy,
  teamSetReadiness
} from "@/ducks/game";
import type { RootState } from "@/config/redux";
import { values } from "remeda";

function* selectStrategy() {
  const managers = yield* select((state: RootState) => state.manager.managers);
  yield* call(setActiveManager, values(managers)[0].id);

  yield* put(setGamePhase("select_strategy"));

  const action = yield* take(managerSelectStrategy);
  const { payload } = action;

  const team = yield* select(
    (state: RootState) => state.manager.managers[payload.manager]?.team
  );

  yield* all([
    put(
      teamSetStrategy({
        team: team!,
        strategy: payload.strategy
      })
    ),
    put(
      teamSetReadiness({
        team: team!,
        readiness: strategies[payload.strategy].initialReadiness()
      })
    )
  ]);
}

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
  yield* call(selectStrategy);
  yield* call(championshipBetting);
}
