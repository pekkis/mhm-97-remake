import { addManager } from "./manager";
import { gameLoop } from "./game";
import { addNotification } from "./notification";
import { advance } from "@/ducks/game";
import {
  quitToMainMenu,
  startGame,
  gameStart as gameStartAction
} from "@/ducks/meta";
import { saveGame } from "@/services/persistence";

import { all, call, put, select, take, fork, cancel } from "typed-redux-saga";
import type { RootState } from "@/config/redux";
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

export function* gameSave() {
  const manager = yield* select(
    (state: RootState) => state.manager.managers[state.manager.active!]
  );
  const state = yield* select((state: RootState) => state);
  // TODO post-pivot: saga path is dead — gameMachine owns persistence.
  // Cast to satisfy GameContext signature until this saga is removed.
  yield* call(saveGame, state as any);
  yield* call(addNotification, manager.id, "Peli tallennettiin.");
}

export default function* metaSagas() {
  yield* all([mainMenu()]);
}
