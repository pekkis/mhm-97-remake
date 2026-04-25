import { setup, assign, fromPromise } from "xstate";

import {
  createDefaultGameContext,
  type GameContext,
  type Manager
} from "@/state";
import { loadGame } from "@/services/persistence";
import { teamsMainCompetition } from "@/machines/selectors";
import difficultyLevels from "@/data/difficulty-levels";

/**
 * Application lifecycle machine.
 *
 * Models the top-level menu ↔ game lifecycle:
 *   menu → starting (new game form) → "in_game"
 *   menu → loading (load from localStorage) → "in_game"
 *   "in_game" → menu (quit)
 *
 * The machine owns the full `GameContext`. While in `menu`, the context
 * holds default values (teams, competitions, country strengths) but no
 * active manager and no in-progress game data. Entering `"in_game"` happens
 * via `START_GAME → GAME_STARTED` (new game) or `LOAD_GAME → GAME_LOADED`
 * (with snapshot payload). `QUIT` resets the context back to defaults.
 *
 * Game-loop state (round/phase progression) will live as nested states
 * under `"in_game"` — this machine is the single root, not a parent of a
 * separate `gameMachine`.
 */

export type ManagerSubmission = {
  name: string;
  arena: string;
  difficulty: string;
  team: number;
};

export type AppMachineEvents =
  | { type: "START_GAME" }
  | { type: "LOAD_GAME" }
  | { type: "GAME_STARTED" }
  | { type: "GAME_LOADED"; payload: GameContext }
  | { type: "QUIT" }
  | {
      type: "ADD_MANAGER";
      payload: ManagerSubmission;
    };

const buildManager = (sub: ManagerSubmission, ctx: GameContext) => {
  const difficulty = parseInt(sub.difficulty, 10);
  const main = teamsMainCompetition(sub.team)(ctx);
  const manager: Manager = {
    id: crypto.randomUUID(),
    name: sub.name,
    difficulty,
    pranksExecuted: 0,
    services: {
      coach: false,
      insurance: false,
      microphone: false,
      cheer: false
    },
    balance: difficultyLevels[difficulty].startBalance,
    arena: { name: sub.arena, level: main === "phl" ? 3 : 0 },
    extra: 0,
    insuranceExtra: 0,
    flags: {}
  };

  return { manager, teamId: sub.team };
};

export const appMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as AppMachineEvents
  },

  actors: {
    load_from_storage: fromPromise<GameContext>(async () => {
      const loaded = loadGame();
      if (!loaded) {
        throw new Error("no saved game");
      }
      return loaded;
    })
  },

  actions: {
    resetContext: assign(() => createDefaultGameContext()),
    loadContext: assign(({ event }) => {
      if (event.type !== "GAME_LOADED") {
        return {};
      }
      return event.payload;
    }),

    assignManager: assign(
      ({ context }, params: { manager: ManagerSubmission }) => {
        const { manager, teamId } = buildManager(params.manager, context);
        return {
          manager: {
            active: manager.id,
            managers: { ...context.manager.managers, [manager.id]: manager }
          },
          teams: context.teams.map((t) =>
            t.id === teamId ? { ...t, manager: manager.id } : t
          )
        };
      }
    )
  }
}).createMachine({
  id: "app",
  initial: "main_menu",
  context: () => createDefaultGameContext(),
  states: {
    main_menu: {
      on: {
        START_GAME: { target: "starting" },
        LOAD_GAME: { target: "loading" }
      }
    },
    starting: {
      on: {
        ADD_MANAGER: {
          actions: [
            {
              type: "assignManager",
              params: ({ event }) => {
                return { manager: event.payload };
              }
            }
          ],

          target: "in_game"
        },
        QUIT: { target: "main_menu", actions: "resetContext" }
      }
    },
    loading: {
      invoke: {
        src: "load_from_storage",
        onDone: {
          target: "in_game"
        },
        onError: {
          target: "main_menu"
        }
      }
    },
    in_game: {
      on: {
        QUIT: { target: "main_menu", actions: "resetContext" }
      }
    }
  }
});
