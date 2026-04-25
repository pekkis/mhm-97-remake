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
      expect(actor.getSnapshot().value).toBe("menu");
    });
  });

  describe("new game flow: menu → starting → inGame", () => {
    it("transitions to starting on START_GAME", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      expect(actor.getSnapshot().value).toBe("starting");
    });

    it("transitions to inGame on GAME_STARTED from starting", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_STARTED" });
      expect(actor.getSnapshot().value).toBe("inGame");
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
      expect(actor.getSnapshot().value).toBe("menu");
    });
  });

  describe("load game flow: menu → loading → inGame", () => {
    it("transitions to loading on LOAD_GAME", () => {
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });
      expect(actor.getSnapshot().value).toBe("loading");
    });

    it("transitions to inGame on GAME_LOADED from loading", () => {
      const actor = createTestActor();
      actor.send({ type: "LOAD_GAME" });
      actor.send({ type: "GAME_LOADED", context: createDefaultGameContext() });
      expect(actor.getSnapshot().value).toBe("inGame");
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
      expect(actor.getSnapshot().value).toBe("menu");
    });
  });

  describe("quit flow: inGame → menu", () => {
    it("transitions back to menu on QUIT from inGame", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_STARTED" });
      expect(actor.getSnapshot().value).toBe("inGame");

      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("menu");
    });

    it("can start a new game after quitting", () => {
      const actor = createTestActor();
      // First game
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_STARTED" });
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("menu");

      // Second game
      actor.send({ type: "LOAD_GAME" });
      actor.send({ type: "GAME_LOADED", context: createDefaultGameContext() });
      expect(actor.getSnapshot().value).toBe("inGame");
    });
  });

  describe("invalid transitions are ignored", () => {
    it("ignores GAME_STARTED in menu state", () => {
      const actor = createTestActor();
      actor.send({ type: "GAME_STARTED" });
      expect(actor.getSnapshot().value).toBe("menu");
    });

    it("ignores GAME_LOADED in menu state", () => {
      const actor = createTestActor();
      actor.send({ type: "GAME_LOADED", context: createDefaultGameContext() });
      expect(actor.getSnapshot().value).toBe("menu");
    });

    it("ignores QUIT in menu state", () => {
      const actor = createTestActor();
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("menu");
    });

    it("ignores START_GAME in inGame state", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_STARTED" });
      actor.send({ type: "START_GAME" });
      expect(actor.getSnapshot().value).toBe("inGame");
    });

    it("ignores LOAD_GAME in inGame state", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_STARTED" });
      actor.send({ type: "LOAD_GAME" });
      expect(actor.getSnapshot().value).toBe("inGame");
    });
  });
});
