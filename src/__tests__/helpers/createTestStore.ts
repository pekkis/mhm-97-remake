/**
 * Test helper: creates a Redux store identical to the production one
 * but without starting the saga middleware. This lets tests dispatch
 * actions directly and assert on state without needing sagas running.
 */
import { configureStore } from "@reduxjs/toolkit";
import * as reducers from "../../ducks";

export function createTestStore() {
  return configureStore({
    reducer: reducers,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: false, serializableCheck: false })
  });
}

export type TestStore = ReturnType<typeof createTestStore>;
