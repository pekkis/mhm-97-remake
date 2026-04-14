/**
 * Pure calculations phase logic.
 *
 * Extracted from `src/sagas/phase/calculations.ts` for execution inside
 * the gameMachine via `assign()`. This is the first phase to be migrated
 * from saga → machine (PR 9).
 *
 * The calculations phase performs three operations:
 *   1. Increment team readiness based on each team's strategy
 *   2. Decrement manager balances for active service costs
 *   3. Decrement all team effect durations by 1
 *
 * No player interaction, no random events — pure deterministic transforms.
 */

import strategies from "@/data/strategies";
import services from "@/data/services";
import { entries } from "remeda";
import { produce } from "immer";
import type { GameContext } from "./types";

/**
 * Execute the calculations phase as a pure function.
 *
 * Takes the current `GameContext` and returns a partial update with:
 *   - teams: readiness adjusted + effect durations decremented
 *   - manager: balances adjusted for service costs
 *
 * Uses immer for safe nested mutations without spread gymnastics.
 */
export function executeCalculationsPhase(
  ctx: GameContext,
): Partial<GameContext> {
  const teams = produce(ctx.teams, (draft) => {
    for (const team of draft) {
      team.readiness += strategies[team.strategy].incrementReadiness(ctx.turn);
      for (const e of team.effects) {
        e.duration -= 1;
      }
      for (const e of team.opponentEffects) {
        e.duration -= 1;
      }
    }
  });

  const manager = produce(ctx.manager, (draft) => {
    for (const [managerId, mgr] of entries(ctx.manager.managers)) {
      const serviceCosts = entries(mgr.services)
        .filter(([, active]) => active)
        .reduce(
          (total, [serviceId]) =>
            total +
            services[serviceId].price(ctx.serviceBasePrices[serviceId], mgr),
          0,
        );

      if (serviceCosts !== 0) {
        draft.managers[managerId].balance -= serviceCosts;
      }
    }
  });

  return { teams, manager };
}
