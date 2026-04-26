import { addManager } from "./manager";
import { gameLoop } from "./game";
import { advance } from "@/ducks/game";
import {
  quitToMainMenu,
  startGame,
  gameStart as gameStartAction
} from "@/ducks/meta";

import { all, call, take, fork, cancel, put } from "typed-redux-saga";
import type { Task } from "redux-saga";

function* gameStart() {
  const action = yield* take(advance);

  yield* call(addManager, action.payload);

  yield* put(gameStartAction());
}

function* mainMenu() {
  do {
    yield* take(startGame);
    yield* call(gameStart);

    const task: Task = yield* fork(gameLoop);

    yield* take(quitToMainMenu);
    yield* cancel(task);
  } while (true);
}

export default function* metaSagas() {
  yield* all([mainMenu()]);
}
