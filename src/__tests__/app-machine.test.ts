import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { appMachine } from "@/machines/app";

const createTestActor = () => {
  const actor = createActor(appMachine);
  actor.start();
  return actor;
};

const managerFormValues = {
  name: "Pier Paolo Pasolini",
  arena: "Cinema Paradiso",
  difficulty: "1",
  team: 5
};

describe("appMachine", () => {
  describe("initial state", () => {
    it("starts in menu state", () => {
      const actor = createTestActor();
      expect(actor.getSnapshot().value).toBe("menu");
    });

    it("has undefined managerFormValues in initial context", () => {
      const actor = createTestActor();
      expect(actor.getSnapshot().context.managerFormValues).toBeUndefined();
    });
  });

  describe("new game flow: menu → starting.pickingManager → starting.submitted → inGame", () => {
    it("transitions to starting.pickingManager on START_GAME", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      expect(actor.getSnapshot().value).toEqual({
        starting: "pickingManager"
      });
    });

    it("transitions to starting.submitted on SUBMIT_MANAGER", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });
      expect(actor.getSnapshot().value).toEqual({
        starting: "submitted"
      });
    });

    it("stores managerFormValues in context on SUBMIT_MANAGER", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });
      expect(actor.getSnapshot().context.managerFormValues).toEqual(
        managerFormValues
      );
    });

    it("transitions to inGame on GAME_STARTED from starting.submitted", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });
      actor.send({ type: "GAME_STARTED" });
      expect(actor.getSnapshot().value).toBe("inGame");
    });

    it("ignores GAME_STARTED in starting.pickingManager (needs SUBMIT_MANAGER first)", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_STARTED" });
      expect(actor.getSnapshot().value).toEqual({
        starting: "pickingManager"
      });
    });

    it("ignores GAME_LOADED while in starting state", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "GAME_LOADED" });
      expect(actor.getSnapshot().value).toEqual({
        starting: "pickingManager"
      });
    });

    it("can quit back to menu from starting.pickingManager", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("menu");
    });

    it("can quit back to menu from starting.submitted", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("menu");
    });

    it("matches('starting') is true while in any starting sub-state", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      expect(actor.getSnapshot().matches("starting")).toBe(true);

      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });
      expect(actor.getSnapshot().matches("starting")).toBe(true);
    });

    it("matches({ starting: 'pickingManager' }) for compound state check", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      expect(
        actor.getSnapshot().matches({ starting: "pickingManager" })
      ).toBe(true);
      expect(
        actor.getSnapshot().matches({ starting: "submitted" })
      ).toBe(false);
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
      actor.send({ type: "GAME_LOADED" });
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
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });
      actor.send({ type: "GAME_STARTED" });
      expect(actor.getSnapshot().value).toBe("inGame");

      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("menu");
    });

    it("can start a new game after quitting", () => {
      const actor = createTestActor();
      // First game
      actor.send({ type: "START_GAME" });
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });
      actor.send({ type: "GAME_STARTED" });
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("menu");

      // Second game (via load)
      actor.send({ type: "LOAD_GAME" });
      actor.send({ type: "GAME_LOADED" });
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
      actor.send({ type: "GAME_LOADED" });
      expect(actor.getSnapshot().value).toBe("menu");
    });

    it("ignores QUIT in menu state", () => {
      const actor = createTestActor();
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("menu");
    });

    it("ignores SUBMIT_MANAGER in menu state", () => {
      const actor = createTestActor();
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });
      expect(actor.getSnapshot().value).toBe("menu");
    });

    it("ignores SUBMIT_MANAGER in starting.submitted", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });

      const newValues = { ...managerFormValues, name: "Changed" };
      actor.send({ type: "SUBMIT_MANAGER", values: newValues });

      // Still in submitted, original values preserved
      expect(actor.getSnapshot().value).toEqual({ starting: "submitted" });
      expect(actor.getSnapshot().context.managerFormValues).toEqual(
        managerFormValues
      );
    });

    it("ignores START_GAME in inGame state", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });
      actor.send({ type: "GAME_STARTED" });
      actor.send({ type: "START_GAME" });
      expect(actor.getSnapshot().value).toBe("inGame");
    });

    it("ignores LOAD_GAME in inGame state", () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });
      actor.send({ type: "GAME_STARTED" });
      actor.send({ type: "LOAD_GAME" });
      expect(actor.getSnapshot().value).toBe("inGame");
    });
  });

  describe("waitFor pattern (saga integration)", () => {
    it("resolves waitFor when machine reaches starting.submitted", async () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });

      const { waitFor } = await import("xstate");
      const waitPromise = waitFor(actor, (snap) =>
        snap.matches({ starting: "submitted" })
      );

      // Submit the form
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });

      // waitFor should resolve
      const snap = await waitPromise;
      expect(snap.matches({ starting: "submitted" })).toBe(true);
      expect(snap.context.managerFormValues).toEqual(managerFormValues);
    });

    it("resolves immediately if already in starting.submitted", async () => {
      const actor = createTestActor();
      actor.send({ type: "START_GAME" });
      actor.send({ type: "SUBMIT_MANAGER", values: managerFormValues });

      const { waitFor } = await import("xstate");
      const snap = await waitFor(actor, (s) =>
        s.matches({ starting: "submitted" })
      );
      expect(snap.context.managerFormValues).toEqual(managerFormValues);
    });
  });
});
