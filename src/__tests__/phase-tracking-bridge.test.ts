import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { gameMachine } from "@/machines/game";
import type { GameContext } from "@/machines/types";
import type { Competition } from "@/types/competitions";
import calendar from "@/data/calendar";

/** Minimal stub for Competition fields */
const stubCompetition: Competition = {
  id: "phl",
  abbr: "PHL",
  name: "Stub",
  weight: 1,
  phase: -1,
  teams: [],
  phases: []
};

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
  pranks: [],
  stats: {
    managers: {},
    currentSeason: undefined,
    seasons: [],
    streaks: { team: {}, manager: {} }
  },
  invitation: { invitations: [] },
  country: {},
  ...overrides
});

const createTestGameActor = (overrides: Partial<GameContext> = {}) => {
  const ctx = createTestContext(overrides);
  const actor = createActor(gameMachine, { input: ctx });
  actor.start();
  return actor;
};

describe("phase tracking bridge", () => {
  describe("SYNC_REDUX_PHASE event", () => {
    it("updates reduxPhase in context", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      actor.send({ type: "SYNC_REDUX_PHASE", phase: "action" });
      expect(actor.getSnapshot().context.reduxPhase).toBe("action");
    });

    it("tracks sub-phases within a calendar phase", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      // The calendar phase is "startOfSeason" but Redux sets sub-phases
      expect(actor.getSnapshot().context.currentPhase).toBe("startOfSeason");

      actor.send({ type: "SYNC_REDUX_PHASE", phase: "select-strategy" });
      expect(actor.getSnapshot().context.reduxPhase).toBe("select-strategy");
      // currentPhase remains the calendar phase
      expect(actor.getSnapshot().context.currentPhase).toBe("startOfSeason");

      actor.send({
        type: "SYNC_REDUX_PHASE",
        phase: "championship-betting"
      });
      expect(actor.getSnapshot().context.reduxPhase).toBe(
        "championship-betting"
      );
    });

    it("is ignored in idle state", () => {
      const actor = createTestGameActor();
      actor.send({ type: "SYNC_REDUX_PHASE", phase: "action" });
      expect(actor.getSnapshot().value).toBe("idle");
      expect(actor.getSnapshot().context.reduxPhase).toBeUndefined();
    });

    it("reduxPhase resets on round transition", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });
      actor.send({ type: "SYNC_REDUX_PHASE", phase: "action" });
      expect(actor.getSnapshot().context.reduxPhase).toBe("action");

      // Complete round 0 (startOfSeason, seed)
      actor.send({ type: "PHASE_COMPLETE" }); // seed done
      actor.send({ type: "PHASE_COMPLETE" }); // round end → round 1

      // reduxPhase should be cleared on round transition
      expect(actor.getSnapshot().context.reduxPhase).toBeUndefined();
    });
  });

  describe("PHASE_COMPLETE bridge walkthrough", () => {
    it("walks through round 0 phases correctly", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      const round0Phases = calendar[0].phases;
      // Round 0 is ["startOfSeason", "seed"]
      expect(round0Phases).toEqual(["startOfSeason", "seed"]);

      // After START: first phase consumed
      expect(actor.getSnapshot().context.currentPhase).toBe("startOfSeason");

      // Saga completes startOfSeason → PHASE_COMPLETE
      actor.send({ type: "PHASE_COMPLETE" });
      expect(actor.getSnapshot().context.currentPhase).toBe("seed");

      // Saga completes seed → PHASE_COMPLETE → round ends → round 1 starts
      actor.send({ type: "PHASE_COMPLETE" });
      expect(actor.getSnapshot().context.turn.round).toBe(1);
    });

    it("walks through a full defaultPhases round", () => {
      // Round 1 uses defaultPhases
      const actor = createTestGameActor({
        turn: { season: 0, round: 1, phase: undefined }
      });
      actor.send({ type: "START" });

      const round1Phases = calendar[1].phases;
      const expectedDefault = [
        "action",
        "prank",
        "gameday",
        "calculations",
        "eventCreation",
        "event",
        "news",
        "seed"
      ];
      expect(round1Phases).toEqual(expectedDefault);

      // Verify each phase is tracked correctly
      for (let i = 0; i < expectedDefault.length; i++) {
        expect(actor.getSnapshot().context.currentPhase).toBe(
          expectedDefault[i]
        );
        actor.send({ type: "PHASE_COMPLETE" });
      }

      // After all 8 PHASE_COMPLETE events, should be on round 2
      expect(actor.getSnapshot().context.turn.round).toBe(2);
    });

    it("walks through an EHL round (4 phases)", () => {
      // Round 5 is EHL
      const actor = createTestGameActor({
        turn: { season: 0, round: 5, phase: undefined }
      });
      actor.send({ type: "START" });

      const round5Phases = calendar[5].phases;
      expect(round5Phases).toEqual(["action", "gameday", "event", "news"]);

      for (let i = 0; i < round5Phases.length; i++) {
        expect(actor.getSnapshot().context.currentPhase).toBe(round5Phases[i]);
        actor.send({ type: "PHASE_COMPLETE" });
      }

      expect(actor.getSnapshot().context.turn.round).toBe(6);
    });

    it("completes multiple rounds in sequence", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      // Walk through rounds 0, 1, 2
      for (let round = 0; round < 3; round++) {
        const phases = calendar[round].phases;

        // First phase was already consumed on entry (or re-entry)
        for (let i = 0; i < phases.length; i++) {
          expect(actor.getSnapshot().context.currentPhase).toBe(phases[i]);
          actor.send({ type: "PHASE_COMPLETE" });
        }
      }

      expect(actor.getSnapshot().context.turn.round).toBe(3);
    });
  });

  describe("combined SYNC_REDUX_PHASE + PHASE_COMPLETE", () => {
    it("tracks Redux sub-phases alongside machine phase progression", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      // Round 0, phase "startOfSeason" — saga sets sub-phases
      expect(actor.getSnapshot().context.currentPhase).toBe("startOfSeason");

      actor.send({ type: "SYNC_REDUX_PHASE", phase: "select-strategy" });
      expect(actor.getSnapshot().context.reduxPhase).toBe("select-strategy");
      expect(actor.getSnapshot().context.currentPhase).toBe("startOfSeason");

      actor.send({
        type: "SYNC_REDUX_PHASE",
        phase: "championship-betting"
      });
      expect(actor.getSnapshot().context.reduxPhase).toBe(
        "championship-betting"
      );

      // startOfSeason phase completes
      actor.send({ type: "PHASE_COMPLETE" });
      expect(actor.getSnapshot().context.currentPhase).toBe("seed");
      // reduxPhase still holds last value until next SYNC_REDUX_PHASE
      expect(actor.getSnapshot().context.reduxPhase).toBe(
        "championship-betting"
      );

      // Seed phase sets its own redux phase
      actor.send({ type: "SYNC_REDUX_PHASE", phase: "seed" });
      expect(actor.getSnapshot().context.reduxPhase).toBe("seed");

      // seed completes → round 1
      actor.send({ type: "PHASE_COMPLETE" });
      expect(actor.getSnapshot().context.turn.round).toBe(1);
      // reduxPhase cleared on round transition
      expect(actor.getSnapshot().context.reduxPhase).toBeUndefined();
    });
  });

  describe("initial reduxPhase", () => {
    it("starts as undefined", () => {
      const actor = createTestGameActor();
      expect(actor.getSnapshot().context.reduxPhase).toBeUndefined();
    });

    it("remains undefined until explicitly set", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });
      // currentPhase is set from calendar, but reduxPhase is not
      expect(actor.getSnapshot().context.currentPhase).toBe("startOfSeason");
      expect(actor.getSnapshot().context.reduxPhase).toBeUndefined();
    });
  });

  describe("calendar phase ordering validation", () => {
    it("every calendar entry has at least one phase", () => {
      for (let i = 0; i < calendar.length; i++) {
        expect(
          calendar[i].phases.length,
          `round ${i} should have at least 1 phase`
        ).toBeGreaterThan(0);
      }
    });

    it("machine can walk through representative rounds", () => {
      // Walk through rounds 0-10 (start of season, default, EHL mix)
      // instead of all 75, to avoid excessive memory usage
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      for (let round = 0; round < 10; round++) {
        const phases = calendar[round].phases;

        expect(actor.getSnapshot().value).toEqual({
          playing: "executingPhases"
        });
        expect(actor.getSnapshot().context.turn.round).toBe(round);

        for (let i = 0; i < phases.length; i++) {
          expect(actor.getSnapshot().context.currentPhase).toBe(phases[i]);
          actor.send({ type: "PHASE_COMPLETE" });
        }
      }

      expect(actor.getSnapshot().context.turn.round).toBe(10);
    });

    it("walks through all 75 rounds and parks at season end", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      for (let round = 0; round < calendar.length; round++) {
        const phases = calendar[round].phases;
        expect(actor.getSnapshot().context.turn.round).toBe(round);

        for (let i = 0; i < phases.length; i++) {
          expect(actor.getSnapshot().context.currentPhase).toBe(phases[i]);
          actor.send({ type: "PHASE_COMPLETE" });
        }
      }

      // Machine advanced past round 74, parked in waitingForNewSeason
      expect(actor.getSnapshot().context.turn.round).toBe(calendar.length);
      expect(actor.getSnapshot().value).toEqual({
        playing: "waitingForNewSeason"
      });
      actor.stop();
    });

    it("walks through 3 full seasons via actor restart", () => {
      for (let season = 0; season < 3; season++) {
        const actor = createTestGameActor({
          turn: { season, round: 0, phase: undefined }
        });
        actor.send({ type: "START" });

        for (let round = 0; round < calendar.length; round++) {
          for (let i = 0; i < calendar[round].phases.length; i++) {
            actor.send({ type: "PHASE_COMPLETE" });
          }
        }

        expect(actor.getSnapshot().context.turn.round, `season ${season}`).toBe(
          calendar.length
        );
        expect(actor.getSnapshot().value).toEqual({
          playing: "waitingForNewSeason"
        });
        actor.stop();
      }
    });

    it("handles round -1 (season boundary) by parking", () => {
      // SEASON_END sets turn.round = -1 in Redux. The sync middleware
      // starts the actor with this value. The machine should park.
      const actor = createTestGameActor({
        turn: { season: 1, round: -1, phase: undefined }
      });
      actor.send({ type: "START" });

      expect(actor.getSnapshot().value).toEqual({
        playing: "waitingForNewSeason"
      });
      actor.stop();
    });
  });
});
