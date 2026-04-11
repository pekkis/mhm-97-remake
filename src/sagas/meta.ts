import { addManager } from "./manager";
import { gameLoop } from "./game";
import { addNotification } from "./notification";
import { advance } from "../ducks/game";
import {
  quitToMainMenu,
  loadGame,
  startGame,
  gameLoadState,
  gameLoaded,
  gameStart as gameStartAction
} from "../ducks/meta";

import {
  all,
  call,
  put,
  race,
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
  const action = yield* take(advance);

  yield* call(addManager, (action as any).payload);

  yield* put(gameStartAction());
}

function* mainMenu() {
  do {
    const { load } = yield* race({
      load: take(loadGame),
      start: take(startGame)
    });

    if (load) {
      yield* call(gameLoad);
    } else {
      yield* call(gameStart);
    }

    const task: Task = yield* fork(gameLoop);

    yield* take(quitToMainMenu);
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
  yield* put(gameLoadState(state));

  yield* put(gameLoaded());
}

export default function* metaSagas() {
  yield* all([mainMenu()]);
}
