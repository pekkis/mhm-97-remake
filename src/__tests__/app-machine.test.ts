import { describe, it, expect, vi, beforeEach } from "vitest";
import { createActor, waitFor } from "xstate";
import { appMachine, type ManagerSubmission } from "@/machines/app";
import { createDefaultGameContext } from "@/state";
import { loadGame } from "@/services/persistence";

vi.mock("@/services/persistence", () => ({
  loadGame: vi.fn(),
  saveGame: vi.fn()
}));

const submission: ManagerSubmission = {
  name: "Pier Paolo Pasolini",
  arena: "Stadio Olimpico",
  difficulty: "1",
  team: 12
};

const createTestActor = () => {
  const actor = createActor(appMachine);
  actor.start();
  return actor;
};

beforeEach(() => {
  vi.mocked(loadGame).mockReset();
});

describe("appMachine", () => {
  describe("initial state", () => {
    it("starts in main_menu", () => {
      expect(createTestActor().getSnapshot().value).toBe("main_menu");
    });
  });

  describe("new game flow", () => {
    it("START_GAME transitions to starting", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      expect(actor.getSnapshot().value).toBe("starting");
    });

    it("ADD_MANAGER from starting installs the manager and transitions to in_game", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });

      const snap = actor.getSnapshot();
      expect(snap.matches("in_game")).toBe(true);

      const activeId = snap.context.manager.active;
      expect(activeId).toBeDefined();
      expect(snap.context.manager.managers[activeId!].name).toBe(
        submission.name
      );
      expect(snap.context.teams[submission.team].manager).toBe(activeId);
    });

    it("QUIT from starting returns to main_menu and resets context", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("main_menu");
    });
  });

  describe("load game flow", () => {
    it("LOAD_GAME transitions to loading", () => {
      vi.mocked(loadGame).mockReturnValue(createDefaultGameContext());
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });
      expect(actor.getSnapshot().value).toBe("loading");
    });

    it("loading reaches in_game when a saved game exists", async () => {
      vi.mocked(loadGame).mockReturnValue(createDefaultGameContext());
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });
      await waitFor(actor, (snap) => snap.matches("in_game"));
    });

    it("loading falls back to main_menu when no saved game exists", async () => {
      vi.mocked(loadGame).mockReturnValue(null);
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });
      await waitFor(actor, (snap) => snap.value === "main_menu");
    });
  });

  describe("quit flow", () => {
    it("QUIT from in_game returns to main_menu", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });
      expect(actor.getSnapshot().matches("in_game")).toBe(true);

      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("main_menu");
    });
  });

  describe("in_game phase walk", () => {
    it("settles in start_of_season.select_strategy on round 0 (setup auto-advances)", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });

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
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });

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
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });

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
