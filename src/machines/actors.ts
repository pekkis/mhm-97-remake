import { createActor } from "xstate";
import { appMachine } from "./app";
import { gameMachine } from "./game";
import type { GameContext } from "./types";
import type { GameMachineContext } from "./game";

export const appActor = createActor(appMachine);
appActor.start();

// ---------------------------------------------------------------------------
// Dev-only: game machine transition logger with context diffing
// ---------------------------------------------------------------------------

const attachDevLogger = (actor: GameActor) => {
  if (import.meta.env.PROD) {
    return;
  }

  // Load microdiff lazily but subscribe synchronously so we don't miss
  // the initial transitions (idle → roundStart → executingPhases fires
  // synchronously when START is sent).
  let diffFn: typeof import("microdiff").default | undefined;
  import("microdiff").then(({ default: d }) => {
    diffFn = d;
  });

  let prev: GameMachineContext | undefined;

  actor.subscribe((snapshot) => {
    const curr = snapshot.context;
    const stateValue = snapshot.value;

    if (!prev || !diffFn) {
      console.groupCollapsed(
        `%c[game] → ${JSON.stringify(stateValue)}`,
        "color: #7c3aed; font-weight: bold"
      );
      console.log("context", curr);
      console.groupEnd();
    } else {
      const changes = diffFn(prev, curr);
      if (changes.length > 0) {
        console.groupCollapsed(
          `%c[game] → ${JSON.stringify(stateValue)} %c(${changes.length} change${changes.length === 1 ? "" : "s"})`,
          "color: #7c3aed; font-weight: bold",
          "color: #6b7280; font-weight: normal"
        );
        for (const change of changes) {
          const path = change.path.join(".");
          if (change.type === "CHANGE") {
            console.log(
              `  ${path}: %c${JSON.stringify(change.oldValue)}%c → %c${JSON.stringify(change.value)}`,
              "color: #ef4444",
              "color: inherit",
              "color: #22c55e"
            );
          } else if (change.type === "CREATE") {
            console.log(
              `  + ${path}: %c${JSON.stringify(change.value)}`,
              "color: #22c55e"
            );
          } else if (change.type === "REMOVE") {
            console.log(
              `  - ${path}: %c${JSON.stringify(change.oldValue)}`,
              "color: #ef4444"
            );
          }
        }
        console.groupEnd();
      } else {
        console.log(
          `%c[game] → ${JSON.stringify(stateValue)}%c (no context change)`,
          "color: #7c3aed; font-weight: bold",
          "color: #6b7280"
        );
      }
    }

    prev = { ...curr };
  });
};

// ---------------------------------------------------------------------------
// Game actor — lifecycle management
// ---------------------------------------------------------------------------

export type GameActor = ReturnType<typeof createActor<typeof gameMachine>>;

/**
 * The currently active game actor, or `undefined` if no game is running.
 *
 * Use `getGameActor()` to read. Use `startGameActor()` / `stopGameActor()`
 * to manage its lifecycle.
 */
let _gameActor: GameActor | undefined;

/**
 * Get the currently active game actor.
 * Returns `undefined` if no game is running.
 */
export const getGameActor = (): GameActor | undefined => _gameActor;

/**
 * Create, start, and register a game actor with the given initial context.
 *
 * Called when the app transitions to `inGame` — either from a new game
 * or a loaded game. The initial context is derived from the current
 * Redux state during the dual-write transition.
 *
 * Stops any previously active game actor before starting a new one.
 */
export const startGameActor = (initialContext: GameContext): GameActor => {
  if (_gameActor) {
    _gameActor.stop();
  }
  _gameActor = createActor(gameMachine, {
    input: initialContext
  });
  // NOTE: Stately Inspector registration skipped for gameMachine — the large
  // GameContext causes @statelyai/inspect to throw "Cannot read properties of
  // undefined (reading 'config')". The inspector works fine for appMachine and
  // @xstate/store instances which have small contexts.
  _gameActor.start();
  attachDevLogger(_gameActor);
  return _gameActor;
};

/**
 * Stop and unregister the currently active game actor.
 * No-op if no game actor is active.
 */
export const stopGameActor = (): void => {
  if (_gameActor) {
    _gameActor.stop();
    _gameActor = undefined;
  }
};
