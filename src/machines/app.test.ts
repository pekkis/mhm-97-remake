import { describe, it, expect, vi, beforeEach } from "vitest";
import { createActor, waitFor } from "xstate";
import { appMachine } from "@/machines/app";
import type { ManagerSubmission } from "@/machines/game";
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
    it("starts in menu with no pending context and no game ref", () => {
      const snap = createTestActor().getSnapshot();
      expect(snap.value).toBe("menu");
      expect(snap.context.pending).toBeUndefined();
      expect(snap.context.gameRef).toBeUndefined();
    });
  });

  describe("new game flow", () => {
    it("START_GAME transitions to starting and seeds pending with defaults", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      const snap = actor.getSnapshot();
      expect(snap.value).toBe("starting");
      expect(snap.context.pending).toBeDefined();
      expect(snap.context.pending!.manager.active).toBeUndefined();
    });

    it("ADD_MANAGER refines context and transitions to playing", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });

      const snap = actor.getSnapshot();
      expect(snap.value).toBe("playing");
      // pending is handed to the spawned game on entry to `playing`
      // and cleared from app context to avoid duplicate trees.
      expect(snap.context.pending).toBeUndefined();

      const gameCtx = snap.context.gameRef!.getSnapshot().context;
      const activeId = gameCtx.manager.active;
      expect(activeId).toBeDefined();
      expect(gameCtx.manager.managers[activeId!].name).toBe(submission.name);
      expect(gameCtx.teams[submission.team].manager).toBe(activeId);
    });

    it("entering playing spawns a game actor with systemId 'game'", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });

      const snap = actor.getSnapshot();
      expect(snap.context.gameRef).toBeDefined();
      expect(actor.system.get("game")).toBe(snap.context.gameRef);
    });

    it("the spawned game starts in_game with the refined context", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });

      const gameRef = actor.getSnapshot().context.gameRef!;
      const gameSnap = gameRef.getSnapshot();
      expect(gameSnap.matches("in_game")).toBe(true);
      expect(gameSnap.context.manager.active).toBeDefined();
      expect(gameSnap.context.teams[submission.team].manager).toBe(
        gameSnap.context.manager.active
      );
    });

    it("QUIT from starting returns to menu and clears pending", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "QUIT" });

      const snap = actor.getSnapshot();
      expect(snap.value).toBe("menu");
      expect(snap.context.pending).toBeUndefined();
    });
  });

  describe("load game flow", () => {
    it("LOAD_GAME transitions to loading", () => {
      vi.mocked(loadGame).mockReturnValue(createDefaultGameContext());
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });
      expect(actor.getSnapshot().value).toBe("loading");
    });

    it("loading reaches playing with the loaded context handed to the game", async () => {
      const loaded = createDefaultGameContext();
      loaded.turn.season = 7; // marker we can verify survived the handoff
      vi.mocked(loadGame).mockReturnValue(loaded);
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });

      await waitFor(actor, (snap) => snap.value === "playing");
      const snap = actor.getSnapshot();
      expect(snap.context.pending).toBeUndefined();
      expect(snap.context.gameRef).toBeDefined();
      expect(snap.context.gameRef!.getSnapshot().context.turn.season).toBe(7);
    });

    it("loading falls back to menu when no saved game exists", async () => {
      vi.mocked(loadGame).mockReturnValue(null);
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });
      await waitFor(actor, (snap) => snap.value === "menu");
    });
  });

  describe("quit flow", () => {
    it("QUIT from playing returns to menu and drops pending + gameRef", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });
      expect(actor.getSnapshot().value).toBe("playing");

      actor.send({ type: "QUIT" });
      const snap = actor.getSnapshot();
      expect(snap.value).toBe("menu");
      expect(snap.context.pending).toBeUndefined();
      expect(snap.context.gameRef).toBeUndefined();
    });

    it("re-entering playing spawns a fresh game actor", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });
      const firstRef = actor.getSnapshot().context.gameRef;

      actor.send({ type: "QUIT" });
      actor.send({ type: "START_GAME" });
      actor.send({ type: "ADD_MANAGER", payload: submission });
      const secondRef = actor.getSnapshot().context.gameRef;

      expect(secondRef).toBeDefined();
      expect(secondRef).not.toBe(firstRef);
    });
  });
});
