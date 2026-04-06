import { createStore } from "./services/redux";
import {
  getMiddlewares,
  getReducers,
  getEnhancers,
  getSagaMiddleware,
  type RootState
} from "./config/redux";
import type { Store } from "redux";
import getSagas from "./getSagas";

export default function getStore(initialState?: RootState): Store {
  const store = createStore(
    getReducers(),
    getMiddlewares(),
    getEnhancers(),
    initialState
  );

  const sagaMiddleware = getSagaMiddleware();

  // then run the saga
  sagaMiddleware.run(getSagas(), {});

  return store;
}
