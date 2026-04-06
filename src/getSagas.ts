import metaSagas from "./sagas/meta";
import { all, setContext } from "redux-saga/effects";

export default function getSagas() {
  return function* rootSaga(context: Record<string, unknown>) {
    yield setContext(context);
    yield all([metaSagas()]);
  };
}
