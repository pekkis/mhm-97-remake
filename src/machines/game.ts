/**
 * gameMachine — the central game state machine.
 *
 * This is the skeleton for the game machine that will eventually own
 * all game state (currently in Redux). It models the round-based game
 * loop that the saga `gameLoop` in `src/sagas/game.ts` currently drives.
 *
 * ## Round lifecycle (mirrors saga gameLoop)
 *
 *   idle → playing
 *     playing contains the round loop:
 *       roundStart → executingPhases → roundEnd → (back to roundStart)
 *
 * ## What this PR does
 *
 * - Defines the machine skeleton with states and transitions
 * - Stores `GameContext` as machine context
 * - Looks up the calendar entry on `roundStart` entry
 * - Stores current round's phase list in context for sequential consumption
 * - Does NOT yet implement phase execution (PRs 7–9)
 * - Does NOT yet replace Redux (dual-write transition continues)
 *
 * ## Architecture
 *
 * This is a pure machine definition — no side effects, no actor creation.
 * Actor instantiation happens in `src/machines/actors.ts`.
 *
 * The machine receives its initial context when spawned by `appMachine`.
 * During the transition, the initial context is derived from Redux state.
 * Once the migration is complete, it will be the authoritative state owner.
 */

import { setup, assign } from "xstate";
import calendar from "@/data/calendar";
import type { CalendarEntry } from "@/data/calendar";
import type { GameContext } from "./types";

// ---------------------------------------------------------------------------
// Machine context — extends GameContext with round-management fields
// ---------------------------------------------------------------------------

/**
 * Extra context fields that the gameMachine needs beyond the raw game state.
 * These are machine-internal bookkeeping, not game state.
 */
export type GameMachineContext = GameContext & {
  /** The current round's calendar entry, set on roundStart entry */
  currentRoundCalendar: CalendarEntry | undefined;
  /** Phases remaining for the current round (consumed one by one) */
  remainingPhases: string[];
  /** The phase currently being executed (from the machine's calendar-driven list) */
  currentPhase: string | undefined;
  /**
   * The phase name as reported by Redux via `setGamePhase`.
   * This is purely observational — some saga phases set sub-phases
   * (e.g. "select-strategy", "championship-betting" within the
   * "startOfSeason" calendar phase). Tracked for dev logging.
   */
  reduxPhase: string | undefined;
};

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type GameMachineEvents =
  | { type: "START" }
  | { type: "PHASE_COMPLETE" }
  | { type: "SYNC_REDUX_PHASE"; phase: string }
  | { type: "QUIT" };

// ---------------------------------------------------------------------------
// Machine definition
// ---------------------------------------------------------------------------

export const gameMachine = setup({
  types: {
    context: {} as GameMachineContext,
    events: {} as GameMachineEvents,
    input: {} as GameContext
  },
  guards: {
    hasMorePhases: ({ context }) => context.remainingPhases.length > 0,
    noMorePhases: ({ context }) => context.remainingPhases.length === 0
  },
  actions: {
    /**
     * Look up the calendar entry for the current round and populate
     * `remainingPhases` from it. This mirrors the saga's:
     *
     *   const roundData = calendar[turn.round];
     *   const phases = roundData.phases;
     */
    loadRoundFromCalendar: assign(({ context }) => {
      const roundIndex = context.turn.round;
      const entry = calendar[roundIndex];

      if (!entry) {
        // Past the last round — this should never happen in normal gameplay.
        // The endOfSeason phase resets turn.round to 0 before we get here.
        // If we somehow reach this, log a warning and return empty phases
        // so the machine sits in executingPhases (harmless stall).
        console.warn(
          `gameMachine: calendar[${roundIndex}] is undefined — round exceeded calendar length (0–${calendar.length - 1})`
        );
        return {
          currentRoundCalendar: undefined,
          remainingPhases: [],
          currentPhase: undefined
        };
      }

      return {
        currentRoundCalendar: entry,
        remainingPhases: [...entry.phases],
        currentPhase: undefined
      };
    }),

    /**
     * Pop the next phase from `remainingPhases` and set it as `currentPhase`.
     * This is the equivalent of each `if (phases.includes("action"))` branch
     * in the saga, but driven by the phase list instead.
     */
    advanceToNextPhase: assign(({ context }) => {
      const [next, ...rest] = context.remainingPhases;
      return {
        currentPhase: next,
        remainingPhases: rest
      };
    }),

    /**
     * Advance the turn counter (equivalent to `nextTurn` in the saga).
     * Clears round-specific context fields.
     */
    advanceTurn: assign(({ context }) => ({
      turn: {
        ...context.turn,
        round: context.turn.round + 1
      },
      currentRoundCalendar: undefined,
      remainingPhases: [],
      currentPhase: undefined,
      reduxPhase: undefined
    })),

    /**
     * Update the `reduxPhase` field from a `SYNC_REDUX_PHASE` event.
     * This mirrors the phase name that the saga sets via `setGamePhase`
     * in Redux, which can differ from the machine's `currentPhase`
     * (calendar-derived). Purely for dev-time observability.
     */
    syncReduxPhase: assign(({ event }) => ({
      reduxPhase: (event as { type: "SYNC_REDUX_PHASE"; phase: string }).phase
    }))
  }
}).createMachine({
  id: "game",
  initial: "idle",
  context: ({ input }) => ({
    ...input,
    currentRoundCalendar: undefined,
    remainingPhases: [],
    currentPhase: undefined,
    reduxPhase: undefined
  }),
  states: {
    /**
     * Waiting to be started. The machine enters this state when first
     * spawned. Transitions to `playing` when the game begins.
     */
    idle: {
      on: {
        START: { target: "playing" }
      }
    },

    /**
     * The main game loop. Contains the round lifecycle as a compound
     * state: roundStart → executingPhases → roundEnd → (loop).
     *
     * The game loops forever (seasons repeat). The only exit is QUIT,
     * which can be sent from any sub-state.
     */
    playing: {
      initial: "roundStart",
      on: {
        QUIT: { target: "done" },
        /**
         * SYNC_REDUX_PHASE can arrive at any point during gameplay.
         * It just records what Redux thinks the current phase is,
         * without affecting the machine's own phase tracking.
         */
        SYNC_REDUX_PHASE: {
          actions: "syncReduxPhase"
        }
      },
      states: {
        /**
         * Entry point for each round. Loads the calendar entry and
         * populates the phase list for sequential execution.
         *
         * The calendar has 75 rounds (0–74). The endOfSeason phase
         * resets turn.round to 0[season+1], so we never exceed 74
         * in normal gameplay.
         */
        roundStart: {
          entry: "loadRoundFromCalendar",
          always: [
            {
              target: "executingPhases",
              guard: "hasMorePhases"
            },
            {
              // Edge case: round with no phases (shouldn't happen but be safe)
              target: "roundEnd",
              guard: "noMorePhases"
            }
          ]
        },

        /**
         * Sequentially executes phases from the current round's phase list.
         *
         * Currently a skeleton — phases are consumed one at a time via
         * ADVANCE_PHASE / PHASE_COMPLETE events. The actual phase execution
         * logic (action phase, gameday, etc.) will be added in PRs 7–9.
         *
         * The pattern is:
         *   1. Entry: pop next phase from `remainingPhases`
         *   2. Wait for PHASE_COMPLETE (sent by phase actor or saga bridge)
         *   3. If more phases remain → re-enter (self-transition)
         *   4. If no more phases → transition to roundEnd
         */
        executingPhases: {
          entry: "advanceToNextPhase",
          on: {
            PHASE_COMPLETE: [
              {
                target: "executingPhases",
                guard: "hasMorePhases",
                reenter: true
              },
              {
                target: "roundEnd",
                guard: "noMorePhases"
              }
            ]
          }
        },

        /**
         * End of round. Advances the turn counter and loops back to
         * the next round's `roundStart`.
         */
        roundEnd: {
          entry: "advanceTurn",
          always: { target: "roundStart" }
        }
      }
    },

    /**
     * Terminal state — player quit to main menu.
     * The parent `appMachine` handles cleanup (stopping this actor).
     */
    done: {
      type: "final"
    }
  }
});
