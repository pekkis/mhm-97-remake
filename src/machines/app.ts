import { setup, assign } from "xstate";

import { createDefaultGameContext, type GameContext } from "@/state";

/**
 * Application lifecycle machine.
 *
 * Models the top-level menu ↔ game lifecycle:
 *   menu → starting (new game form) → inGame
 *   menu → loading (load from localStorage) → inGame
 *   inGame → menu (quit)
 *
 * The machine owns the full `GameContext`. While in `menu`, the context
 * holds default values (teams, competitions, country strengths) but no
 * active manager and no in-progress game data. Entering `inGame` happens
 * via `START_GAME → GAME_STARTED` (new game) or `LOAD_GAME → GAME_LOADED`
 * (with snapshot payload). `QUIT` resets the context back to defaults.
 *
 * Game-loop state (round/phase progression) will live as nested states
 * under `inGame` — this machine is the single root, not a parent of a
 * separate `gameMachine`.
 */

export type AppMachineEvents =
  | { type: "START_GAME" }
  | { type: "LOAD_GAME" }
  | { type: "GAME_STARTED" }
  | { type: "GAME_LOADED"; context: GameContext }
  | { type: "QUIT" };

export const appMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as AppMachineEvents,
  },
  actions: {
    resetContext: assign(() => createDefaultGameContext()),
    loadContext: assign(({ event }) => {
      if (event.type !== "GAME_LOADED") return {};
      return event.context;
    }),
  },
}).createMachine({
  id: "app",
  initial: "menu",
  context: () => createDefaultGameContext(),
  states: {
    menu: {
      on: {
        START_GAME: { target: "starting" },
        LOAD_GAME: { target: "loading" },
      },
    },
    starting: {
      on: {
        GAME_STARTED: { target: "inGame" },
        QUIT: { target: "menu", actions: "resetContext" },
      },
    },
    loading: {
      on: {
        GAME_LOADED: { target: "inGame", actions: "loadContext" },
        QUIT: { target: "menu", actions: "resetContext" },
      },
    },
    inGame: {
      on: {
        QUIT: { target: "menu", actions: "resetContext" },
      },
    },
  },
});
