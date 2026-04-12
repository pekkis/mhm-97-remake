import { setup, createActor } from "xstate";

/**
 * Application lifecycle machine.
 *
 * Models the top-level menu ↔ game lifecycle:
 *   menu → starting (new game form) → inGame
 *   menu → loading (load from localStorage) → inGame
 *   inGame → menu (quit)
 *
 * This is a pure state model — during the dual-write transition phase,
 * the Redux meta saga still drives side effects (game loop forking,
 * addManager, save/load). The machine is kept in sync via the
 * xstoreSyncMiddleware so that components can read from it instead of
 * the Redux meta duck.
 *
 * Once the game machine (PR 7+) is in place, this machine will own the
 * lifecycle and spawn/stop the game actor directly.
 */

export type AppMachineEvents =
  | { type: "START_GAME" }
  | { type: "LOAD_GAME" }
  | { type: "GAME_STARTED" }
  | { type: "GAME_LOADED" }
  | { type: "QUIT" };

export const appMachine = setup({
  types: {
    events: {} as AppMachineEvents
  }
}).createMachine({
  id: "app",
  initial: "menu",
  states: {
    menu: {
      on: {
        START_GAME: { target: "starting" },
        LOAD_GAME: { target: "loading" }
      }
    },
    starting: {
      on: {
        GAME_STARTED: { target: "inGame" },
        QUIT: { target: "menu" }
      }
    },
    loading: {
      on: {
        GAME_LOADED: { target: "inGame" },
        QUIT: { target: "menu" }
      }
    },
    inGame: {
      on: {
        QUIT: { target: "menu" }
      }
    }
  }
});

/**
 * Module-level singleton actor, following the same pattern as
 * `@xstate/store` instances in `src/stores/`.
 *
 * Started eagerly so it's ready when the sync middleware and
 * components first access it.
 */
export const appActor = createActor(appMachine);
appActor.start();
