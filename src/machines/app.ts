import { assign, setup } from "xstate";
import type { ManagerFormValues } from "@/components/start-menu/ManagerForm";

/**
 * Application lifecycle machine.
 *
 * Models the top-level menu ↔ game lifecycle:
 *   menu → starting (new game form) → inGame
 *   menu → loading (load from localStorage) → inGame
 *   inGame → menu (quit)
 *
 * The `starting` state is compound:
 *   starting.pickingManager — waiting for the user to submit the manager form
 *   starting.submitted — form data stored in context, waiting for saga to
 *     run addManager() + gameStartAction() and transition to inGame
 *
 * This is a pure state model — during the dual-write transition phase,
 * the Redux meta saga still drives side effects (game loop forking,
 * addManager, save/load). The machine is kept in sync via the
 * xstoreSyncMiddleware so that components can read from it instead of
 * the Redux meta duck.
 */

export type AppMachineContext = {
  /** Form values from the manager creation form, set on SUBMIT_MANAGER */
  managerFormValues: ManagerFormValues | undefined;
};

export type AppMachineEvents =
  | { type: "START_GAME" }
  | { type: "LOAD_GAME" }
  | { type: "SUBMIT_MANAGER"; values: ManagerFormValues }
  | { type: "GAME_STARTED" }
  | { type: "GAME_LOADED" }
  | { type: "QUIT" };

export const appMachine = setup({
  types: {
    context: {} as AppMachineContext,
    events: {} as AppMachineEvents
  }
}).createMachine({
  id: "app",
  initial: "menu",
  context: {
    managerFormValues: undefined
  },
  states: {
    menu: {
      on: {
        START_GAME: { target: "starting" },
        LOAD_GAME: { target: "loading" }
      }
    },
    starting: {
      initial: "pickingManager",
      on: {
        QUIT: { target: "menu" }
      },
      states: {
        pickingManager: {
          on: {
            SUBMIT_MANAGER: {
              target: "submitted",
              actions: assign({
                managerFormValues: ({ event }) => event.values
              })
            }
          }
        },
        submitted: {
          on: {
            GAME_STARTED: { target: "#app.inGame" }
          }
        }
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
