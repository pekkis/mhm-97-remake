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
import type { GameContext } from "./types";

/**
 * Execute the calculations phase as a pure function.
 *
 * Takes the current `GameContext` and returns a partial update with:
 *   - teams: readiness adjusted + effect durations decremented
 *   - manager: balances adjusted for service costs
 *
 * The returned object is spread into the machine's context via `assign()`.
 */
export function executeCalculationsPhase(
  ctx: GameContext
): Partial<GameContext> {
  const { turn, teams, manager, serviceBasePrices } = ctx;

  // 1. Increment readiness based on strategy
  // 2. Decrement all effect/opponentEffect durations by 1
  const updatedTeams = teams.map((team) => {
    const increment = strategies[team.strategy].incrementReadiness(turn);

    return {
      ...team,
      readiness: team.readiness + increment,
      effects: team.effects.map((e) => ({ ...e, duration: e.duration - 1 })),
      opponentEffects: team.opponentEffects.map((e) => ({
        ...e,
        duration: e.duration - 1
      }))
    };
  });

  // 3. Decrement manager balances for active service costs
  const updatedManagers = { ...manager.managers };
  for (const [managerId, mgr] of entries(manager.managers)) {
    const activeServices = entries(mgr.services)
      .filter(([, active]) => active)
      .map(([k]) => [k, services[k]] as const);

    const serviceCosts = activeServices.reduce(
      (total, [serviceId, svc]) =>
        total + svc.price(serviceBasePrices[serviceId], mgr),
      0
    );

    if (serviceCosts !== 0) {
      updatedManagers[managerId] = {
        ...mgr,
        balance: mgr.balance - serviceCosts
      };
    }
  }

  return {
    teams: updatedTeams,
    manager: {
      ...manager,
      managers: updatedManagers
    }
  };
}
