import { select, call, put } from "typed-redux-saga";
import prankTypes from "../../data/pranks";
import type { PrankInstance } from "../../data/pranks";
import type { RootState } from "../../config/redux";

export default function* prankPhase() {
  const pranks: PrankInstance[] = yield* select(
    (state: RootState) => state.prank.pranks
  );

  console.log("PRANK FUCKING TIME!");

  for (const [prankId, prank] of pranks.entries()) {
    console.log("PRANK TO EXECUTE", prank);
    const prankInfo = prankTypes[prank.type];
    const prankExecutor = prankInfo.execute;

    yield* call(prankExecutor, prank);
    yield* put({
      type: "PRANK_DISMISS" as const,
      payload: prankId
    });
  }
}
