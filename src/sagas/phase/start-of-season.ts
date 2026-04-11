import { take, put, select, call, all, race } from "typed-redux-saga";
import { seasonStart } from "../game";
import strategies from "../../data/strategies";
import { requestChampionBet } from "../../ducks/betting";
import { betChampion } from "../betting";
import { setActiveManager } from "../manager";
import { managerSelectStrategy } from "../../ducks/manager";
import {
  setGamePhase,
  teamSetStrategy,
  teamSetReadiness
} from "../../ducks/game";
import type { RootState } from "../../config/redux";

function* selectStrategy() {
  const managers = yield* select((state: RootState) => state.manager.managers);
  yield* call(setActiveManager, Object.values(managers)[0].id);

  yield* put(setGamePhase("select-strategy"));

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
  yield* put(setGamePhase("championship-betting"));

  const { bet } = yield* race({
    bet: take(requestChampionBet),
    advance: take("GAME_ADVANCE_REQUEST")
  });

  if (bet) {
    console.log("BET", bet);

    const { payload } = bet as any;
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
