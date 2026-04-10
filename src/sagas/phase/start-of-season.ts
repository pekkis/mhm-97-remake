import { take, putResolve, select, call, all, race } from "typed-redux-saga";
import { seasonStart } from "../game";
import strategies from "../../data/strategies";
import { BETTING_BET_CHAMPION_REQUEST } from "../../ducks/betting";
import { betChampion } from "../betting";
import { setActiveManager } from "../manager";
import type { RootState } from "../../config/redux";

function* selectStrategy() {
  const managers = yield* select((state: RootState) => state.manager.managers);
  yield* call(setActiveManager, Object.values(managers)[0].id);

  yield* putResolve({
    type: "GAME_SET_PHASE" as const,
    payload: "select-strategy"
  });

  const action: any = yield* take("MANAGER_SELECT_STRATEGY");
  const { payload } = action;

  const team = yield* select(
    (state: RootState) =>
      state.manager.managers[payload.manager as string]?.team
  );

  yield* all([
    putResolve({
      type: "TEAM_SET_STRATEGY" as const,
      payload: {
        team,
        strategy: payload.strategy
      }
    }),
    putResolve({
      type: "TEAM_SET_READINESS" as const,
      payload: {
        team,
        readiness: strategies[payload.strategy].initialReadiness()
      }
    })
  ]);
}

function* championshipBetting() {
  yield* putResolve({
    type: "GAME_SET_PHASE" as const,
    payload: "championship-betting"
  });

  const { bet } = yield* race({
    bet: take(BETTING_BET_CHAMPION_REQUEST),
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
