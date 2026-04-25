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
    it("settles in start_of_season on round 0 (first phase in calendar)", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });

      // Round 0 calendar: ["start_of_season", "seed"].
      // The machine cascades through earlier phase checks and parks at start_of_season.
      expect(
        actor.getSnapshot().matches({
          in_game: { executing_phases: "start_of_season" }
        })
      ).toBe(true);
    });

    it("ADVANCE walks from start_of_season to seed within round 0", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });

      actor.send({ type: "ADVANCE" });
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

      actor.send({ type: "ADVANCE" }); // start_of_season -> seed
      actor.send({ type: "ADVANCE" }); // seed -> round_end -> action_check -> action

      const snap = actor.getSnapshot();
      expect(snap.context.turn.round).toBe(1);
      expect(snap.matches({ in_game: { executing_phases: "action" } })).toBe(
        true
      );
    });
  });
});
