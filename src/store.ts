import { configureStore } from "@reduxjs/toolkit";
import * as reducers from "./ducks";

const store = configureStore({
  reducer: reducers
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
