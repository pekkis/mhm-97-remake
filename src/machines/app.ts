import { setup, assign, fromPromise } from "xstate";
import type { ActorRefFrom } from "xstate";

import {
  createDefaultGameContext,
  type GameContext,
  type Manager
} from "@/state";
import { loadGame } from "@/services/persistence";
import { gameMachine } from "@/machines/game";
import type { ManagerSubmission } from "@/machines/game";
import { teamsMainCompetition } from "@/machines/selectors";
import difficultyLevels from "@/data/difficulty-levels";

/**
 * Top-level application lifecycle machine.
 *
 * Owns the menu ↔ game shell. Holds a *pending* `GameContext` only
 * during `starting` / `loading` — i.e. while the new-game wizard or the
 * load actor is refining the context that will be handed to a spawned
 * `gameMachine` on entry to `playing`. Once spawned, the game owns its
 * context fully; app drops the reference on `QUIT`.
 *
 * The same flow scales to a richer wizard (MHM 2000): each step refines
 * `pending`, the final step spawns the game with the finished context.
 */

export type AppContext = {
  pending: GameContext | undefined;
  gameRef: ActorRefFrom<typeof gameMachine> | undefined;
};

export type AppMachineEvents =
  | { type: "START_GAME" }
  | { type: "LOAD_GAME" }
  | { type: "ADD_MANAGER"; payload: ManagerSubmission }
  | { type: "QUIT" };

/**
 * Pure refinement: take the current pending `GameContext` and the wizard's
 * manager submission, return a `GameContext` with the manager installed and
 * the chosen team flagged. 1-1 port of the legacy `buildManager` +
 * `assignManager` action that used to live in `gameMachine`.
 */
const withManager = (
  ctx: GameContext,
  submission: ManagerSubmission
): GameContext => {
  const difficulty = parseInt(submission.difficulty, 10);
  const main = teamsMainCompetition(submission.team)(ctx);
  const manager: Manager = {
    id: crypto.randomUUID(),
    name: submission.name,
    team: submission.team,
    difficulty,
    pranksExecuted: 0,
    services: {
      coach: false,
      insurance: false,
      microphone: false,
      cheer: false
    },
    balance: difficultyLevels[difficulty].startBalance,
    arena: { name: submission.arena, level: main === "phl" ? 3 : 0 },
    extra: 0,
    insuranceExtra: 0,
    flags: {}
  };

  return {
    ...ctx,
    manager: {
      active: manager.id,
      managers: { ...ctx.manager.managers, [manager.id]: manager }
    },
    teams: ctx.teams.map((t) =>
      t.id === submission.team ? { ...t, manager: manager.id } : t
    )
  };
};

export const appMachine = setup({
  types: {
    context: {} as AppContext,
    events: {} as AppMachineEvents
  },
  actors: {
    load_from_storage: fromPromise<GameContext>(async () => {
      const loaded = loadGame();
      if (!loaded) {
        throw new Error("no saved game");
      }
      return loaded;
    }),
    game: gameMachine
  }
}).createMachine({
  id: "app",
  initial: "menu",
  context: { pending: undefined, gameRef: undefined },
  states: {
    menu: {
      on: {
        START_GAME: {
          target: "starting",
          actions: assign({ pending: () => createDefaultGameContext() })
        },
        LOAD_GAME: { target: "loading" }
      }
    },
    starting: {
      on: {
        ADD_MANAGER: {
          target: "playing",
          actions: assign({
            pending: ({ context, event }) =>
              withManager(context.pending!, event.payload)
          })
        },
        QUIT: {
          target: "menu",
          actions: assign({ pending: undefined })
        }
      }
    },
    loading: {
      invoke: {
        src: "load_from_storage",
        onDone: {
          target: "playing",
          actions: assign({ pending: ({ event }) => event.output })
        },
        onError: { target: "menu" }
      }
    },
    playing: {
      entry: assign({
        gameRef: ({ context, spawn }) =>
          spawn("game", { systemId: "game", input: context.pending! })
      }),
      exit: assign({ pending: undefined, gameRef: undefined }),
      on: {
        QUIT: { target: "menu" }
      }
    }
  }
});
