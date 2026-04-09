import * as reducers from "../ducks";
import createSagaMiddleware from "redux-saga";
import type { SagaMiddleware } from "redux-saga";
import type { Middleware, Reducer, StoreEnhancer } from "redux";
import { useSelector, useDispatch } from "react-redux";

export type RootState = {
  [K in keyof typeof reducers]: ReturnType<(typeof reducers)[K]>;
};

export type AppDispatch = (...args: any[]) => any;

export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

const sagaMiddleware = createSagaMiddleware();

export function getMiddlewares(): Middleware[] {
  let middlewares = [sagaMiddleware];
  return middlewares;
}

export function getSagaMiddleware(): SagaMiddleware {
  return sagaMiddleware;
}

export function getReducers(): { [key: string]: Reducer<any, any> } {
  return reducers as { [key: string]: Reducer<any, any> };
}

export function getEnhancers(): StoreEnhancer[] {
  return [];
}
