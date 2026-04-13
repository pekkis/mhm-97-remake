import { createActor } from "xstate";
import { appMachine } from "./app";
import { gameMachine } from "./game";
import type { GameContext } from "./types";
import type { GameMachineContext } from "./game";

export const appActor = createActor(appMachine);
appActor.start();

// ---------------------------------------------------------------------------
// Dev-only: game machine transition logger (Redux DevTools-style)
// ---------------------------------------------------------------------------

/**
 * Format a state value for display.
 * `{ playing: "executingPhases" }` → `"playing.executingPhases"`
 * `"idle"` → `"idle"`
 */
const formatState = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.map(([k, v]) => `${k}.${formatState(v)}`).join(", ");
  }
  return String(value);
};

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
    const state = formatState(snapshot.value);
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false });

    if (!prev || !diffFn) {
      // First meaningful transition or diff lib not loaded yet
      console.groupCollapsed(
        `%c[game]%c  → ${state}  %c@ ${time}`,
        "color: #7c3aed; font-weight: bold",
        "color: #9ca3af; font-weight: normal",
        "color: #6b7280; font-weight: normal"
      );
      console.log("state", snapshot.value);
      console.log("context", curr);
      console.groupEnd();
    } else {
      const changes = diffFn(prev, curr);
      if (changes.length > 0) {
        console.groupCollapsed(
          `%c[game]%c  → ${state}  %c(${changes.length} Δ)  %c@ ${time}`,
          "color: #7c3aed; font-weight: bold",
          "color: #9ca3af; font-weight: normal",
          "color: #d97706; font-weight: normal",
          "color: #6b7280; font-weight: normal"
        );
        for (const change of changes) {
          const path = change.path.join(".");
          if (change.type === "CHANGE") {
            console.log(
              `%c  ▸ %c${path}  %c${JSON.stringify(change.oldValue)}%c → %c${JSON.stringify(change.value)}`,
              "color: #6b7280",
              "color: #e5e7eb; font-weight: bold",
              "color: #ef4444; text-decoration: line-through",
              "color: inherit",
              "color: #22c55e"
            );
          } else if (change.type === "CREATE") {
            console.log(
              `%c  + %c${path}  %c${JSON.stringify(change.value)}`,
              "color: #22c55e",
              "color: #e5e7eb; font-weight: bold",
              "color: #22c55e"
            );
          } else if (change.type === "REMOVE") {
            console.log(
              `%c  − %c${path}  %c${JSON.stringify(change.oldValue)}`,
              "color: #ef4444",
              "color: #e5e7eb; font-weight: bold",
              "color: #ef4444; text-decoration: line-through"
            );
          }
        }
        console.log("%cprev", "color: #6b7280", prev);
        console.log("%cnext", "color: #6b7280", curr);
        console.groupEnd();
      }
      // No log for zero-diff transitions (always transitions, noise)
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
