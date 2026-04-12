import { put, call, select } from "typed-redux-saga";

import prankTypes from "../data/pranks";
import type { PrankInstance } from "../data/pranks";
import { managerCompetesIn } from "@/selectors";
import { decrementBalance } from "../sagas/manager";
import { addPrank } from "../ducks/prank";

export function* orderPrank(action: {
  payload: { manager: string; victim: number; type: string };
}) {
  const {
    payload: { manager, victim, type }
  } = action;

  const prank: PrankInstance = { manager, victim, type };

  const competesInPHL = yield* select(managerCompetesIn(manager, "phl"));
  const targetCompetition = competesInPHL ? "phl" : "division";

  const prankPrice = prankTypes[prank.type].price(targetCompetition);

  yield* call(decrementBalance, manager, prankPrice);

  yield* put(addPrank(prank));

  const prankOrderer = prankTypes[prank.type].order;

  yield* call(prankOrderer, prank);
}
