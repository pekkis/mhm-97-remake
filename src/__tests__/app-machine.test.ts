import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { appMachine } from "@/machines/app";
import { createDefaultGameContext } from "@/state";

const createTestActor = () => {
  const actor = createActor(appMachine);
  actor.start();
  return actor;
};

describe("appMachine", () => {
  describe("initial state", () => {
    it("starts in menu state", () => {
      const actor = createTestActor();
      expect(actor.getSnapshot().value).toBe("main_menu");
    });
  });

  describe("new game flow: menu → starting → "in_game"", () => {
    it("transitions to starting on START_GAME", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      expect(actor.getSnapshot().value).toBe("starting");
    });

    it("transitions to "in_game" on GAME_STARTED from starting", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_STARTED" });
      expect(actor.getSnapshot().value).toBe("in_game");
    });

    it("ignores GAME_LOADED while in starting state", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_LOADED", context: createDefaultGameContext() });
      expect(actor.getSnapshot().value).toBe("starting");
    });

    it("can quit back to menu from starting", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("main_menu");
    });
  });

  describe("load game flow: menu → loading → "in_game"", () => {
    it("transitions to loading on LOAD_GAME", () => {
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });
      expect(actor.getSnapshot().value).toBe("loading");
    });

    it("transitions to "in_game" on GAME_LOADED from loading", () => {
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });
      actor.send({ type: "GAME_LOADED", context: createDefaultGameContext() });
      expect(actor.getSnapshot().value).toBe("in_game");
    });

    it("ignores GAME_STARTED while in loading state", () => {
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });
      actor.send({ type: "GAME_STARTED" });
      expect(actor.getSnapshot().value).toBe("loading");
    });

    it("can quit back to menu from loading", () => {
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("main_menu");
    });
  });

  describe("quit flow: "in_game" → menu", () => {
    it("transitions back to menu on QUIT from "in_game"", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_STARTED" });
      expect(actor.getSnapshot().value).toBe("in_game");

      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("main_menu");
    });

    it("can start a new game after quitting", () => {
      const actor = createTestActor();
      // First game
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_STARTED" });
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("main_menu");

      // Second game
      actor.send({ type: "LOAD_GAME" });
      actor.send({ type: "GAME_LOADED", context: createDefaultGameContext() });
      expect(actor.getSnapshot().value).toBe("in_game");
    });
  });

  describe("invalid transitions are ignored", () => {
    it("ignores GAME_STARTED in menu state", () => {
      const actor = createTestActor();
      actor.send({ type: "GAME_STARTED" });
      expect(actor.getSnapshot().value).toBe("main_menu");
    });

    it("ignores GAME_LOADED in menu state", () => {
      const actor = createTestActor();
      actor.send({ type: "GAME_LOADED", context: createDefaultGameContext() });
      expect(actor.getSnapshot().value).toBe("main_menu");
    });

    it("ignores QUIT in menu state", () => {
      const actor = createTestActor();
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("main_menu");
    });

    it("ignores START_GAME in "in_game" state", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_STARTED" });
      actor.send({ type: "START_GAME" });
      expect(actor.getSnapshot().value).toBe("in_game");
    });

    it("ignores LOAD_GAME in "in_game" state", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_STARTED" });
      actor.send({ type: "LOAD_GAME" });
      expect(actor.getSnapshot().value).toBe("in_game");
    });
  });
});
