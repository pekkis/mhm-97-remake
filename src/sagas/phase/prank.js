import { select, call, put } from "redux-saga/effects";
import prankTypes from "../../data/pranks";

export default function* prankPhase() {
  const pranks = yield select((state) => state.prank.pranks);

  console.log("PRANK FUCKING TIME!");

  for (const [prankId, prank] of pranks.entries()) {
    console.log("PRANK TO EXECUTE", prank);
    const prankInfo = prankTypes[prank.type];
    const prankExecutor = prankInfo.execute;

    yield call(prankExecutor, prank);
    yield put({
      type: "PRANK_DISMISS",
      payload: prankId
    });
  }
}
