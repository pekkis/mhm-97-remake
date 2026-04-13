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
  /** The phase currently being executed (for display/debugging) */
  currentPhase: string | undefined;
};

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type GameMachineEvents =
  | { type: "START" }
  | { type: "PHASE_COMPLETE" }
  | { type: "ROUND_COMPLETE" }
  | { type: "ADVANCE_PHASE" }
  | { type: "SEASON_ENDED" };

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
    noMorePhases: ({ context }) => context.remainingPhases.length === 0,
    seasonOver: ({ context }) => calendar[context.turn.round] === undefined
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
        // Past the last round — season is over.
        // The `seasonOver` guard will catch this and transition to `done`.
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
      currentPhase: undefined
    }))
  }
}).createMachine({
  id: "game",
  initial: "idle",
  context: ({ input }) => ({
    ...input,
    currentRoundCalendar: undefined,
    remainingPhases: [],
    currentPhase: undefined
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
     */
    playing: {
      initial: "roundStart",
      states: {
        /**
         * Entry point for each round. Loads the calendar entry and
         * populates the phase list for sequential execution.
         *
         * If the current round is past the end of the calendar (75 rounds,
         * 0–74), the `seasonOver` guard fires and we transition to `done`.
         */
        roundStart: {
          entry: "loadRoundFromCalendar",
          always: [
            {
              target: "#game.done",
              guard: "seasonOver"
            },
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
     * Terminal state — game is over (season ended or quit).
     * The parent `appMachine` handles cleanup.
     */
    done: {
      type: "final"
    }
  }
});
