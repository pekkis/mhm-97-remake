import { put, putResolve, select, call } from "redux-saga/effects";

import strategies from "../../data/strategies";
import services from "../../data/services";
import { decrementBalance } from "../manager";

export default function* calculationsPhase() {
  const turn = yield select((state) => state.game.turn);

  console.log("CALCULATIONS PHASE FOR TURN #", turn.round);

  const teams = yield select((state) => state.game.teams);

  for (const team of teams) {
    const readinessIncrementer = strategies[team.strategy].incrementReadiness;

    const amountToIncrement = readinessIncrementer(turn);

    if (amountToIncrement !== 0) {
      yield put({
        type: "TEAM_INCREMENT_READINESS",
        payload: {
          team: team.id,
          amount: amountToIncrement
        }
      });
    }
  }

  const managers = yield select((state) => state.manager.managers);

  const basePrices = yield select((state) => state.game.serviceBasePrices);

  for (const [managerId, manager] of Object.entries(managers)) {
    const managersServices = Object.entries(manager.services)
      .filter(([, active]) => active)
      .map(([k]) => [k, services[k]]);

    const serviceCosts = managersServices.reduce((r, [serviceId, service]) => {
      console.log(r, service);
      return r + service.price(basePrices[serviceId], manager);
    }, 0);

    yield call(decrementBalance, managerId, serviceCosts);
  }

  // TODO: MOVE DIS?
  yield putResolve({ type: "GAME_DECREMENT_DURATIONS" });
}
