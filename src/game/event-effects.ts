import type { Draft } from "immer";

import type { GameContext } from "@/state";
import type { GameFlags, TeamEffect } from "@/state/game";
import type { CompetitionId } from "@/types/competitions";
import { computeStats } from "@/services/competition-type";

/**
 * Declarative effect descriptors.
 *
 * Events return a list of these from their pure `process(ctx, data)`
 * function. The interpreter (`applyEffect`) translates each descriptor
 * into a draft mutation. This keeps event files saga-free, fully
 * serializable (effect lists could be logged/replayed), and trivially
 * testable as `process(ctx, data) === expected`.
 *
 * The alphabet was extracted by reading every saga helper called from
 * the 96 event `process`/`create`/`resolve` functions. If a new event
 * needs a verb that isn't here, add it to the union and to
 * `applyEffect` — don't reach for an escape hatch.
 *
 * Random rolls happen during `create`/`resolve` (where they're baked
 * into the stored payload) — `process` is fully deterministic.
 */
export type EventEffect =
  // ── Manager balance ──
  | { type: "incrementBalance"; manager: string; amount: number }
  | { type: "decrementBalance"; manager: string; amount: number }
  | { type: "setBalance"; manager: string; amount: number }

  // ── Manager arena / extras / services ──
  | { type: "setArenaLevel"; manager: string; level: number }
  | { type: "renameArena"; manager: string; name: string }
  | { type: "setExtra"; manager: string; extra: number }
  | { type: "incrementInsuranceExtra"; manager: string; amount: number }
  | { type: "setInsuranceExtra"; manager: string; extra: number }
  | { type: "setService"; manager: string; service: string; value: boolean }
  | { type: "hireManager"; manager: string; team: number }

  // ── Team strength / morale / readiness / strategy ──
  | { type: "incrementStrength"; team: number; amount: number }
  | { type: "decrementStrength"; team: number; amount: number }
  | { type: "incrementMorale"; team: number; amount: number }
  | { type: "decrementMorale"; team: number; amount: number }
  | { type: "incrementReadiness"; team: number; amount: number }
  | { type: "setMorale"; team: number; value: number }
  | { type: "setReadiness"; team: number; value: number }
  | { type: "setStrategy"; team: number; value: number }
  | { type: "renameTeam"; team: number; name: string }

  // ── Team buffs / debuffs ──
  | { type: "addTeamEffect"; team: number; effect: TeamEffect }
  | { type: "addOpponentEffect"; team: number; effect: TeamEffect }

  // ── Competition penalties ──
  | {
      type: "incurPenalty";
      competition: CompetitionId;
      phase: number;
      group: number;
      team: number;
      penalty: number;
    }

  // ── Game-level state ──
  | {
      type: "setGameFlag";
      flag: keyof GameFlags;
      value: GameFlags[keyof GameFlags];
    }
  | {
      type: "setManagerFlag";
      manager: string;
      flag: string;
      value: boolean;
    }
  | { type: "incrementServiceBasePrice"; service: string; amount: number }

  // ── News (events sometimes push announcements during process) ──
  | { type: "addAnnouncement"; manager: string; text: string };

/**
 * Apply a single effect to a game-context draft. Pure mutation —
 * never reads anything not on `effect` (lookups must happen in the
 * event's `process` function and be encoded into the descriptor).
 *
 * Use from inside an `assign(({context}) => produce(context, draft => …))`
 * pass: walk the effect list, call `applyEffect(draft, effect)` for each.
 */
export function applyEffect(
  draft: Draft<GameContext>,
  effect: EventEffect
): void {
  switch (effect.type) {
    // ── Manager balance ──
    case "incrementBalance": {
      const m = draft.manager.managers[effect.manager];
      if (m) {
        m.balance += effect.amount;
      }
      return;
    }
    case "decrementBalance": {
      const m = draft.manager.managers[effect.manager];
      if (m) {
        m.balance -= effect.amount;
      }
      return;
    }
    case "setBalance": {
      const m = draft.manager.managers[effect.manager];
      if (m) {
        m.balance = effect.amount;
      }
      return;
    }

    // ── Manager arena / extras / services ──
    case "setArenaLevel": {
      const m = draft.manager.managers[effect.manager];
      if (m) {
        m.arena.level = effect.level;
      }
      return;
    }
    case "renameArena": {
      const m = draft.manager.managers[effect.manager];
      if (m) {
        m.arena.name = effect.name;
      }
      return;
    }
    case "setExtra": {
      const m = draft.manager.managers[effect.manager];
      if (m) {
        m.extra = effect.extra;
      }
      return;
    }
    case "incrementInsuranceExtra": {
      const m = draft.manager.managers[effect.manager];
      if (m) {
        m.insuranceExtra += effect.amount;
      }
      return;
    }
    case "setInsuranceExtra": {
      const m = draft.manager.managers[effect.manager];
      if (m) {
        m.insuranceExtra = effect.extra;
      }
      return;
    }
    case "setService": {
      const m = draft.manager.managers[effect.manager];
      if (m) {
        m.services[effect.service] = effect.value;
      }
      return;
    }
    case "hireManager": {
      // Atomic: detach from current team, attach to new team.
      // 1-1 port of `hireManager` saga in src/sagas/manager.ts.
      const m = draft.manager.managers[effect.manager];
      if (!m) {
        return;
      }
      if (m.team !== undefined) {
        const oldTeam = draft.teams[m.team];
        if (oldTeam) {
          oldTeam.manager = undefined;
        }
      }
      const newTeam = draft.teams[effect.team];
      if (newTeam) {
        newTeam.manager = effect.manager;
      }
      m.team = effect.team;
      return;
    }

    // ── Team strength / morale / readiness / strategy ──
    case "incrementStrength": {
      const t = draft.teams[effect.team];
      if (t) {
        t.strength += effect.amount;
      }
      return;
    }
    case "decrementStrength": {
      const t = draft.teams[effect.team];
      if (t) {
        t.strength -= effect.amount;
      }
      return;
    }
    case "incrementMorale": {
      const t = draft.teams[effect.team];
      if (t) {
        t.morale += effect.amount;
      }
      return;
    }
    case "decrementMorale": {
      const t = draft.teams[effect.team];
      if (t) {
        t.morale -= effect.amount;
      }
      return;
    }
    case "incrementReadiness": {
      const t = draft.teams[effect.team];
      if (t) {
        t.readiness += effect.amount;
      }
      return;
    }
    case "setMorale": {
      const t = draft.teams[effect.team];
      if (t) {
        t.morale = effect.value;
      }
      return;
    }
    case "setReadiness": {
      const t = draft.teams[effect.team];
      if (t) {
        t.readiness = effect.value;
      }
      return;
    }
    case "setStrategy": {
      const t = draft.teams[effect.team];
      if (t) {
        t.strategy = effect.value;
      }
      return;
    }
    case "renameTeam": {
      const t = draft.teams[effect.team];
      if (t) {
        t.name = effect.name;
      }
      return;
    }

    // ── Team buffs / debuffs ──
    case "addTeamEffect": {
      const t = draft.teams[effect.team];
      if (t) {
        t.effects.push(effect.effect);
      }
      return;
    }
    case "addOpponentEffect": {
      const t = draft.teams[effect.team];
      if (t) {
        t.opponentEffects.push(effect.effect);
      }
      return;
    }

    // ── Competition penalties ──
    case "incurPenalty": {
      const phase =
        draft.competitions[effect.competition]?.phases[effect.phase];
      const group = phase?.groups[effect.group];
      if (!group || group.type !== "round-robin") {
        return;
      }
      group.penalties.push({ team: effect.team, penalty: effect.penalty });
      // 1-1 port of `incurPenalty` saga: recompute standings after penalty.
      group.stats = computeStats(group);
      return;
    }

    // ── Game-level state ──
    case "setGameFlag": {
      // Cast: discriminated union loses per-flag value type after
      // narrowing on `flag`. `setGameFlag` is the boundary; callers
      // (event `process` fns) carry the type safety by construction.
      (draft.flags[effect.flag] as GameFlags[keyof GameFlags]) = effect.value;
      return;
    }
    case "setManagerFlag": {
      const m = draft.manager.managers[effect.manager];
      if (m) {
        m.flags[effect.flag] = effect.value;
      }
      return;
    }
    case "incrementServiceBasePrice": {
      if (effect.service in draft.serviceBasePrices) {
        draft.serviceBasePrices[effect.service] += effect.amount;
      }
      return;
    }

    // ── News ──
    case "addAnnouncement": {
      if (!draft.news.announcements[effect.manager]) {
        draft.news.announcements[effect.manager] = [];
      }
      draft.news.announcements[effect.manager].push(effect.text);
      return;
    }
  }
}

/**
 * Convenience wrapper. Walks an effect list applying each.
 */
export function applyEffects(
  draft: Draft<GameContext>,
  effects: EventEffect[]
): void {
  for (const effect of effects) {
    applyEffect(draft, effect);
  }
}
