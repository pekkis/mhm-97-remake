import { addManager } from "./manager";
import { gameLoop } from "./game";
import { addNotification } from "./notification";

import {
  all,
  call,
  race,
  putResolve,
  select,
  take,
  fork,
  cancel
} from "typed-redux-saga";
import type { RootState } from "../config/redux";
import type { Task } from "redux-saga";

const save = (state: RootState) => {
  const json = JSON.stringify(state);
  window.localStorage.setItem("mhm97", json);
};

const load = (): RootState | null => {
  const json = window.localStorage.getItem("mhm97");
  if (!json) {
    return null;
  }
  return JSON.parse(json);
};

function* gameStart() {
  const action = yield* take("GAME_ADVANCE_REQUEST");

  yield* call(addManager, (action as any).payload);

  yield* putResolve({
    type: "GAME_START" as const
  });
}

function* mainMenu() {
  do {
    const { load } = yield* race({
      load: take("META_GAME_LOAD_REQUEST"),
      start: take("META_GAME_START_REQUEST")
    });

    if (load) {
      yield* call(gameLoad);
    } else {
      yield* call(gameStart);
    }

    const task: Task = yield* fork(gameLoop);

    yield* take("META_QUIT_TO_MAIN_MENU");
    yield* cancel(task);
  } while (true);
}

export function* gameSave() {
  const manager = yield* select(
    (state: RootState) => state.manager.managers[state.manager.active!]
  );
  const state = yield* select((state: RootState) => state);
  yield* call(save, state);
  yield* call(addNotification, manager.id, "Peli tallennettiin.");
}

function* gameLoad() {
  const state = yield* call(load);
  yield* putResolve({
    type: "META_GAME_LOAD_STATE" as const,
    payload: state
  });

  yield* putResolve({
    type: "META_GAME_LOADED" as const
  });
}

export default function* metaSagas() {
  yield* all([mainMenu()]);
}
