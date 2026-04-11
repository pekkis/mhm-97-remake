import { select, call, put } from "typed-redux-saga";
import prankTypes from "../../data/pranks";
import { dismissPrank } from "../../ducks/prank";
import type { RootState } from "../../config/redux";

export default function* prankPhase() {
  const pranks = yield* select((state: RootState) => state.prank.pranks);

  for (const [prankId, prank] of pranks.entries()) {
    const prankInfo = prankTypes[prank.type];
    const prankExecutor = prankInfo.execute;

    yield* call(prankExecutor, prank);
    yield* put(dismissPrank(prankId));
  }
}
