import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { gameMachine } from "@/machines/game";
import type { GameContext } from "@/machines/types";
import type { Competition } from "@/types/competitions";
import calendar from "@/data/calendar";

/** Minimal stub for Competition fields (not exercised by the machine skeleton) */
const stubCompetition: Competition = {
  id: "phl",
  abbr: "PHL",
  name: "Stub",
  weight: 1,
  phase: -1,
  teams: [],
  phases: []
};

/**
 * Creates a minimal `GameContext` for testing.
 *
 * Only populates the fields the game machine actually reads for its
 * round/phase management. The rest are stubs — the machine skeleton
 * doesn't look at them yet.
 */
const createTestContext = (
  overrides: Partial<GameContext> = {}
): GameContext => ({
  turn: { season: 0, round: 0, phase: undefined },
  flags: {
    jarko: false,
    usa: false,
    canada: false,
    haanperaMarried: false,
    mauto: false,
    psycho: undefined
  },
  serviceBasePrices: {},
  managers: [],
  competitions: {
    phl: stubCompetition,
    division: stubCompetition,
    ehl: stubCompetition,
    tournaments: stubCompetition
  },
  teams: [],
  worldChampionshipResults: undefined,
  manager: { active: undefined, managers: {} },
  betting: { bets: [], championshipBets: [] },
  event: { events: {} },
  news: { news: [], announcements: {} },
  notification: { notifications: [] },
  prank: { pranks: [] },
  stats: {
    managers: {},
    currentSeason: undefined,
    seasons: [],
    streaks: { team: {}, manager: {} }
  },
  invitation: { invitations: [] },
  country: { countries: {} },
  ...overrides
});

const createTestGameActor = (overrides: Partial<GameContext> = {}) => {
  const ctx = createTestContext(overrides);
  const actor = createActor(gameMachine, { input: ctx });
  actor.start();
  return actor;
};

describe("gameMachine", () => {
  describe("initial state", () => {
    it("starts in idle state", () => {
      const actor = createTestGameActor();
      expect(actor.getSnapshot().value).toBe("idle");
    });

    it("has undefined currentRoundCalendar initially", () => {
      const actor = createTestGameActor();
      expect(actor.getSnapshot().context.currentRoundCalendar).toBeUndefined();
    });

    it("has empty remainingPhases initially", () => {
      const actor = createTestGameActor();
      expect(actor.getSnapshot().context.remainingPhases).toEqual([]);
    });

    it("preserves initial game context", () => {
      const actor = createTestGameActor({
        turn: { season: 1, round: 5, phase: "action" }
      });
      expect(actor.getSnapshot().context.turn).toEqual({
        season: 1,
        round: 5,
        phase: "action"
      });
    });
  });

  describe("idle → playing transition", () => {
    it("transitions to playing.roundStart on START", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });
      expect(actor.getSnapshot().value).toEqual({
        playing: "executingPhases"
      });
    });

    it("ignores PHASE_COMPLETE in idle state", () => {
      const actor = createTestGameActor();
      actor.send({ type: "PHASE_COMPLETE" });
      expect(actor.getSnapshot().value).toBe("idle");
    });
  });

  describe("round lifecycle", () => {
    it("loads calendar entry for current round on roundStart", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      const ctx = actor.getSnapshot().context;
      const expectedEntry = calendar[0];
      expect(ctx.currentRoundCalendar).toEqual(expectedEntry);
    });

    it("populates remainingPhases from calendar entry", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      const ctx = actor.getSnapshot().context;
      // Round 0 has phases ["startOfSeason", "seed"]
      // After entering executingPhases, the first phase is consumed
      const expectedPhases = calendar[0].phases;
      expect(ctx.currentPhase).toBe(expectedPhases[0]);
      // remainingPhases should have everything except the first
      expect(ctx.remainingPhases).toEqual(expectedPhases.slice(1));
    });

    it("advances to next phase on PHASE_COMPLETE", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      // Round 0 has ["startOfSeason", "seed"]
      // After START: currentPhase = "startOfSeason", remainingPhases = ["seed"]
      expect(actor.getSnapshot().context.currentPhase).toBe("startOfSeason");

      actor.send({ type: "PHASE_COMPLETE" });
      // Now: currentPhase = "seed", remainingPhases = []
      expect(actor.getSnapshot().context.currentPhase).toBe("seed");
      expect(actor.getSnapshot().context.remainingPhases).toEqual([]);
    });

    it("transitions to roundEnd → next roundStart when all phases complete", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      // Round 0: ["startOfSeason", "seed"] — 2 phases
      // After START, first phase is consumed → complete 1 more
      actor.send({ type: "PHASE_COMPLETE" }); // seed

      // Now all phases done → roundEnd → advances turn → roundStart → next round
      actor.send({ type: "PHASE_COMPLETE" });

      const ctx = actor.getSnapshot().context;
      // Turn should have advanced to round 1
      expect(ctx.turn.round).toBe(1);
      // Should now be executing phases for round 1
      expect(ctx.currentRoundCalendar).toEqual(calendar[1]);
    });

    it("executes multiple rounds correctly", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      // Complete round 0 (startOfSeason, seed)
      actor.send({ type: "PHASE_COMPLETE" }); // seed done
      actor.send({ type: "PHASE_COMPLETE" }); // round end → round 1

      expect(actor.getSnapshot().context.turn.round).toBe(1);

      // Round 1 is phlDiv() — has defaultPhases (8 phases)
      const round1Phases = calendar[1].phases;
      // First phase already consumed on entry to executingPhases
      expect(actor.getSnapshot().context.currentPhase).toBe(round1Phases[0]);

      // Complete all phases of round 1
      for (let i = 1; i < round1Phases.length; i++) {
        actor.send({ type: "PHASE_COMPLETE" });
      }

      // One more PHASE_COMPLETE to trigger roundEnd → roundStart for round 2
      actor.send({ type: "PHASE_COMPLETE" });
      expect(actor.getSnapshot().context.turn.round).toBe(2);
    });
  });

  describe("calendar integration", () => {
    it("round 0 has startOfSeason + seed phases", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      const entry = actor.getSnapshot().context.currentRoundCalendar!;
      expect(entry.phases).toContain("startOfSeason");
      expect(entry.phases).toContain("seed");
    });

    it("round 1 has default phases (action through seed)", () => {
      // Start at round 1
      const actor = createTestGameActor({
        turn: { season: 0, round: 1, phase: undefined }
      });
      actor.send({ type: "START" });

      const entry = actor.getSnapshot().context.currentRoundCalendar!;
      expect(entry.phases).toContain("action");
      expect(entry.phases).toContain("prank");
      expect(entry.phases).toContain("gameday");
      expect(entry.phases).toContain("calculations");
      expect(entry.phases).toContain("eventCreation");
      expect(entry.phases).toContain("event");
      expect(entry.phases).toContain("news");
      expect(entry.phases).toContain("seed");
    });

    it("EHL round (5) has limited phases", () => {
      const actor = createTestGameActor({
        turn: { season: 0, round: 5, phase: undefined }
      });
      actor.send({ type: "START" });

      const entry = actor.getSnapshot().context.currentRoundCalendar!;
      expect(entry.phases).toEqual(["action", "gameday", "event", "news"]);
    });
  });

  describe("context preservation", () => {
    it("preserves game context fields across round transitions", () => {
      const actor = createTestGameActor({
        turn: { season: 2, round: 0, phase: undefined },
        flags: {
          jarko: true,
          usa: false,
          canada: false,
          haanperaMarried: false,
          mauto: false,
          psycho: undefined
        }
      });
      actor.send({ type: "START" });

      // Complete round 0
      const phasesCount = calendar[0].phases.length;
      for (let i = 1; i < phasesCount; i++) {
        actor.send({ type: "PHASE_COMPLETE" });
      }
      actor.send({ type: "PHASE_COMPLETE" }); // trigger roundEnd

      const ctx = actor.getSnapshot().context;
      // Season should be preserved
      expect(ctx.turn.season).toBe(2);
      // Flags should be preserved
      expect(ctx.flags.jarko).toBe(true);
      expect(ctx.flags.psycho).toBeUndefined();
    });
  });

  describe("lifecycle management", () => {
    it("can be stopped cleanly", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });
      expect(actor.getSnapshot().status).toBe("active");

      actor.stop();
      expect(actor.getSnapshot().status).toBe("stopped");
    });

    it("does not respond to events after stopping", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });
      actor.stop();

      // Sending to a stopped actor should not throw
      actor.send({ type: "PHASE_COMPLETE" });
      expect(actor.getSnapshot().status).toBe("stopped");
    });
  });

  describe("quit", () => {
    it("transitions to done on QUIT from executingPhases", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });
      expect(actor.getSnapshot().value).toEqual({
        playing: "executingPhases"
      });

      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("done");
      expect(actor.getSnapshot().status).toBe("done");
    });

    it("transitions to done on QUIT from any round", () => {
      const actor = createTestGameActor({
        turn: { season: 0, round: 10, phase: undefined }
      });
      actor.send({ type: "START" });
      actor.send({ type: "QUIT" });

      expect(actor.getSnapshot().value).toBe("done");
    });

    it("ignores QUIT in idle state", () => {
      const actor = createTestGameActor();
      actor.send({ type: "QUIT" });
      expect(actor.getSnapshot().value).toBe("idle");
    });
  });

  describe("season boundary", () => {
    it("the last valid round (74) still executes phases", () => {
      const lastRound = calendar.length - 1;
      const actor = createTestGameActor({
        turn: { season: 0, round: lastRound, phase: undefined }
      });
      actor.send({ type: "START" });

      // Should be in executingPhases, not done
      expect(actor.getSnapshot().value).toEqual({
        playing: "executingPhases"
      });
      expect(actor.getSnapshot().context.currentRoundCalendar).toEqual(
        calendar[lastRound]
      );
    });
  });
});
