import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { gameMachine } from "@/machines/game";
import { createDefaultGameContext } from "@/state";
import type { GameContext, Manager } from "@/state";

const buildContextWithManager = (): GameContext => {
  const ctx = createDefaultGameContext();
  const manager: Manager = {
    id: "pasolini",
    name: "Pier Paolo Pasolini",
    team: 12,
    difficulty: 1,
    pranksExecuted: 0,
    services: {
      coach: false,
      insurance: false,
      microphone: false,
      cheer: false
    },
    balance: 0,
    arena: { name: "Stadio Olimpico", level: 0 },
    extra: 0,
    insuranceExtra: 0,
    flags: {}
  };
  return {
    ...ctx,
    manager: { active: manager.id, managers: { [manager.id]: manager } },
    teams: ctx.teams.map((t) =>
      t.id === 12 ? { ...t, manager: manager.id } : t
    )
  };
};

const createTestActor = () => {
  const actor = createActor(gameMachine, { input: buildContextWithManager() });
  actor.start();
  return actor;
};

describe("gameMachine", () => {
  describe("startup", () => {
    it("starts directly in_game with the supplied context", () => {
      const actor = createTestActor();
      const snap = actor.getSnapshot();
      expect(snap.matches("in_game")).toBe(true);
      expect(snap.context.manager.active).toBe("pasolini");
    });
  });

  describe("in_game phase walk", () => {
    it("settles in start_of_season.select_strategy on round 0 (setup auto-advances)", () => {
      const actor = createTestActor();
      // Round 0 calendar: ["start_of_season", "seed"].
      // Machine cascades through earlier phase checks, enters start_of_season,
      // setup auto-advances, parks at select_strategy.
      expect(
        actor.getSnapshot().matches({
          in_game: { executing_phases: { start_of_season: "select_strategy" } }
        })
      ).toBe(true);
    });

    it("ADVANCE walks start_of_season sub-states then exits to seed", () => {
      const actor = createTestActor();
      const activeId = actor.getSnapshot().context.manager.active!;
      actor.send({
        type: "SELECT_STRATEGY",
        payload: { manager: activeId, strategy: 2 }
      });
      expect(
        actor.getSnapshot().matches({
          in_game: {
            executing_phases: { start_of_season: "championship_betting" }
          }
        })
      ).toBe(true);

      actor.send({ type: "ADVANCE" }); // championship_betting -> done -> seed_check -> seed
      expect(
        actor.getSnapshot().matches({
          in_game: { executing_phases: "seed" }
        })
      ).toBe(true);
    });

    it("ADVANCE through round 0 lands in round 1's first phase (action) and bumps turn.round", () => {
      const actor = createTestActor();
      const activeId = actor.getSnapshot().context.manager.active!;
      actor.send({
        type: "SELECT_STRATEGY",
        payload: { manager: activeId, strategy: 2 }
      });
      actor.send({ type: "ADVANCE" }); // championship_betting -> done -> seed
      actor.send({ type: "ADVANCE" }); // seed -> round_end -> action_check -> action

      const snap = actor.getSnapshot();
      expect(snap.context.turn.round).toBe(1);
      expect(snap.matches({ in_game: { executing_phases: "action" } })).toBe(
        true
      );
    });
  });
});
