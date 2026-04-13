import { createActor } from "xstate";
import { appMachine } from "./app";
import { gameMachine } from "./game";
import type { GameContext } from "./types";

export const appActor = createActor(appMachine);
appActor.start();

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
  _gameActor.start();
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
