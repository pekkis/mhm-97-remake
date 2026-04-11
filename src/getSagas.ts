import metaSagas from "./sagas/meta";
import { all, setContext } from "typed-redux-saga";

export default function getSagas() {
  return function* rootSaga(context: Record<string, unknown>) {
    yield* setContext(context);
    yield* all([metaSagas()]);
  };
}
