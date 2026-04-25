/**
 * Game persistence service — save/load game state to/from localStorage.
 *
 * Extracted from `src/sagas/meta.ts` (PR 6) to decouple persistence
 * from the saga layer. During the XState migration, this service will
 * be called from the game machine instead of sagas.
 *
 * Currently serializes the full Redux `RootState`. Once `gameMachine`
 * owns all game state, this will serialize `GameContext` instead.
 */

import type { GameContext } from "@/state";

const STORAGE_KEY = "mhm97";

/**
 * Save the full game state to localStorage.
 */
export const saveGame = (context: GameContext): void => {
  const json = JSON.stringify(context);
  localStorage.setItem(STORAGE_KEY, json);
};

/**
 * Load game state from localStorage.
 * Returns `null` if no saved game exists.
 */
export const loadGame = (): GameContext | null => {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) {
    return null;
  }
  return JSON.parse(json);
};
