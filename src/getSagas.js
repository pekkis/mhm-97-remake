import metaSagas from "./sagas/meta";

// import { dataMonitor } from "./sagas/data";
import { all, setContext } from "redux-saga/effects";

export default function getSagas() {
  return function* getSagas(context) {
    yield setContext(context);
    yield all([
      metaSagas()
      // gameSagas(),
      // eventSagas(),
      // managerSagas()
      // userSagas(),
      // uiSagas(),
      // chatSagas(),
      // lootboxSagas(),
      // dataMonitor()
    ]);
  };
}
