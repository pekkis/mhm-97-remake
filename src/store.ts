import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import * as reducers from "./ducks";
import getSagas from "./getSagas";

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware)
});

sagaMiddleware.run(getSagas(), {});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
