import { put, select, call } from "typed-redux-saga";

import strategies from "../../data/strategies";
import services from "../../data/services";
import { decrementBalance } from "../manager";
import { teamIncrementReadiness, decrementDurations } from "../../ducks/game";
import type { RootState } from "../../config/redux";

export default function* calculationsPhase() {
  const turn = yield* select((state: RootState) => state.game.turn);

  console.log("CALCULATIONS PHASE FOR TURN #", turn.round);

  const teams = yield* select((state: RootState) => state.game.teams);

  for (const team of teams) {
    const readinessIncrementer = strategies[team.strategy].incrementReadiness;

    const amountToIncrement = readinessIncrementer(turn);

    if (amountToIncrement !== 0) {
      yield* put(
        teamIncrementReadiness({
          team: team.id,
          amount: amountToIncrement
        })
      );
    }
  }

  const managers = yield* select((state: RootState) => state.manager.managers);

  const basePrices = yield* select(
    (state: RootState) => state.game.serviceBasePrices
  );

  for (const [managerId, manager] of Object.entries(managers)) {
    const managersServices = Object.entries(manager.services)
      .filter(([, active]) => active)
      .map(([k]) => [k, services[k]] as const);

    const serviceCosts = managersServices.reduce((r, [serviceId, service]) => {
      console.log(r, service);
      return r + service.price(basePrices[serviceId], manager);
    }, 0);

    yield* call(decrementBalance, managerId, serviceCosts);
  }

  // TODO: MOVE DIS?
  yield* put(decrementDurations());
}
