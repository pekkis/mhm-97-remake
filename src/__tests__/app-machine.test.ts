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
      expect(snap.value).toBe("in_game");

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
      await waitFor(actor, (snap) => snap.value === "in_game");
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
      expect(actor.getSnapshot().value).toBe("in_game");

      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("main_menu");
    });
  });
});
