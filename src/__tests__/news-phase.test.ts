import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { gameMachine } from "@/machines/game";
import type { GameContext } from "@/machines/types";
import type { Competition } from "@/types/competitions";
import calendar from "@/data/calendar";

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

/**
 * Find a round that has "news" in its phases.
 * Returns the round index + the phase list.
 */
const findRoundWithNews = () => {
  for (let i = 0; i < calendar.length; i++) {
    if (calendar[i].phases.includes("news")) {
      return { round: i, phases: calendar[i].phases };
    }
  }
  throw new Error("No round with 'news' phase found in calendar");
};

/**
 * Find a round that has "news" preceded by at least one other phase,
 * so we can test that ADVANCE only fires at the right time.
 */
const findRoundWithNewsPrecededByOtherPhase = () => {
  for (let i = 0; i < calendar.length; i++) {
    const phases = calendar[i].phases;
    const newsIdx = phases.indexOf("news");
    if (newsIdx > 0) {
      return { round: i, phases };
    }
  }
  throw new Error(
    "No round with 'news' preceded by another phase found in calendar"
  );
};

describe("news phase — ADVANCE event on gameMachine", () => {
  describe("basic ADVANCE handling", () => {
    it("ADVANCE transitions from executingPhases like PHASE_COMPLETE", () => {
      const { round, phases } = findRoundWithNews();
      const actor = createTestGameActor({
        turn: { season: 0, round, phase: undefined }
      });
      actor.send({ type: "START" });

      // Walk to the news phase via PHASE_COMPLETE for preceding phases
      const newsIdx = phases.indexOf("news");
      for (let i = 0; i < newsIdx; i++) {
        actor.send({ type: "PHASE_COMPLETE" });
      }

      // Now currentPhase should be "news"
      expect(actor.getSnapshot().context.currentPhase).toBe("news");
      expect(actor.getSnapshot().value).toEqual({ playing: "executingPhases" });

      // User sends ADVANCE instead of PHASE_COMPLETE
      actor.send({ type: "ADVANCE" });

      // Machine should have moved past "news"
      const snap = actor.getSnapshot();
      expect(snap.context.currentPhase).not.toBe("news");
    });

    it("ADVANCE with remaining phases re-enters executingPhases", () => {
      const { round, phases } = findRoundWithNews();
      const newsIdx = phases.indexOf("news");
      const hasMoreAfterNews = newsIdx < phases.length - 1;

      // Only test if there are phases after news
      if (!hasMoreAfterNews) {
        return;
      }

      const actor = createTestGameActor({
        turn: { season: 0, round, phase: undefined }
      });
      actor.send({ type: "START" });

      for (let i = 0; i < newsIdx; i++) {
        actor.send({ type: "PHASE_COMPLETE" });
      }

      expect(actor.getSnapshot().context.currentPhase).toBe("news");
      actor.send({ type: "ADVANCE" });

      // Should still be executing phases (the next one)
      expect(actor.getSnapshot().value).toEqual({ playing: "executingPhases" });
      expect(actor.getSnapshot().context.currentPhase).toBe(
        phases[newsIdx + 1]
      );
    });

    it("ADVANCE on last phase transitions to roundEnd → roundStart", () => {
      // Find a round where "news" is the last phase
      let lastNewsRound: { round: number; phases: string[] } | undefined;
      for (let i = 0; i < calendar.length; i++) {
        const phases = calendar[i].phases;
        if (phases[phases.length - 1] === "news") {
          lastNewsRound = { round: i, phases };
          break;
        }
      }

      if (!lastNewsRound) {
        // No round ends with "news" — skip test (not a failure)
        return;
      }

      const actor = createTestGameActor({
        turn: { season: 0, round: lastNewsRound.round, phase: undefined }
      });
      actor.send({ type: "START" });

      // Walk to news
      const newsIdx = lastNewsRound.phases.indexOf("news");
      for (let i = 0; i < newsIdx; i++) {
        actor.send({ type: "PHASE_COMPLETE" });
      }

      expect(actor.getSnapshot().context.currentPhase).toBe("news");
      actor.send({ type: "ADVANCE" });

      // Should have advanced to next round
      expect(actor.getSnapshot().context.turn.round).toBe(
        lastNewsRound.round + 1
      );
    });
  });

  describe("ADVANCE does not affect non-news phases", () => {
    it("ADVANCE during a non-interactive phase still advances the machine", () => {
      // ADVANCE and PHASE_COMPLETE are functionally identical at the machine
      // level — both advance to the next phase. The distinction is semantic:
      // ADVANCE comes from user interaction, PHASE_COMPLETE from saga bridge.
      // The machine doesn't care which one fires.
      const actor = createTestGameActor({
        turn: { season: 0, round: 0, phase: undefined }
      });
      actor.send({ type: "START" });

      const firstPhase = actor.getSnapshot().context.currentPhase;
      expect(firstPhase).toBeDefined();

      actor.send({ type: "ADVANCE" });
      expect(actor.getSnapshot().context.currentPhase).not.toBe(firstPhase);
    });
  });

  describe("ADVANCE + PHASE_COMPLETE interleaving", () => {
    it("can mix ADVANCE and PHASE_COMPLETE in the same round", () => {
      const { round, phases } = findRoundWithNewsPrecededByOtherPhase();
      const actor = createTestGameActor({
        turn: { season: 0, round, phase: undefined }
      });
      actor.send({ type: "START" });

      const newsIdx = phases.indexOf("news");

      // Use PHASE_COMPLETE for phases before news
      for (let i = 0; i < newsIdx; i++) {
        expect(actor.getSnapshot().context.currentPhase).toBe(phases[i]);
        actor.send({ type: "PHASE_COMPLETE" });
      }

      // Use ADVANCE for news
      expect(actor.getSnapshot().context.currentPhase).toBe("news");
      actor.send({ type: "ADVANCE" });

      // Use PHASE_COMPLETE for phases after news
      for (let i = newsIdx + 1; i < phases.length; i++) {
        expect(actor.getSnapshot().context.currentPhase).toBe(phases[i]);
        actor.send({ type: "PHASE_COMPLETE" });
      }
    });
  });

  describe("waitFor pattern", () => {
    it("currentPhase changes from 'news' after ADVANCE", async () => {
      const { round, phases } = findRoundWithNews();
      const actor = createTestGameActor({
        turn: { season: 0, round, phase: undefined }
      });
      actor.send({ type: "START" });

      // Walk to news
      const newsIdx = phases.indexOf("news");
      for (let i = 0; i < newsIdx; i++) {
        actor.send({ type: "PHASE_COMPLETE" });
      }

      expect(actor.getSnapshot().context.currentPhase).toBe("news");

      // Simulate the saga's waitFor pattern
      const { waitFor } = await import("xstate");
      const waitPromise = waitFor(
        actor,
        (snap) => snap.context.currentPhase !== "news"
      );

      // User clicks advance
      actor.send({ type: "ADVANCE" });

      // waitFor should resolve
      const snap = await waitPromise;
      expect(snap.context.currentPhase).not.toBe("news");
    });
  });
});
