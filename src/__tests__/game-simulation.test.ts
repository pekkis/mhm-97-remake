import { describe, it, expect } from "vitest";
import { createTestStore } from "./helpers/createTestStore";
import calendar from "../data/calendar";
import {
  nextTurn,
  seasonStart,
  seasonEnd,
  clearExpired,
  decrementDurations,
  teamAddManager,
  teamAddEffect,
  teamIncrementMorale
} from "../ducks/game";
import { managerAdd, managerSetActive } from "../ducks/manager";
import { clearAnnouncements } from "../ducks/news";
import { clearEvents } from "../ducks/event";

/**
 * Creates a test store with a registered manager, simulating what
 * the addManager saga does (without needing sagas).
 */
function createGameStore() {
  const store = createTestStore();

  // Register a manager (mirrors src/sagas/manager.ts addManager)
  const managerId = "test-manager-id";
  store.dispatch(
    managerAdd({
      manager: {
        id: managerId,
        name: "Pier Paolo Pasolini",
        difficulty: 2,
        pranksExecuted: 0,
        services: {
          coach: false,
          insurance: false,
          microphone: false,
          cheer: false
        },
        balance: 0,
        arena: { name: "Salò Arena", level: 3 },
        extra: 0,
        insuranceExtra: 0,
        flags: {}
      }
    })
  );
  store.dispatch(managerSetActive(managerId));
  store.dispatch(teamAddManager({ team: 12, manager: managerId }));

  return { store, managerId };
}

/**
 * Simulates the nextTurn saga without actually running sagas:
 * clears announcements, clears events, advances round.
 */
function simulateNextTurn(store: ReturnType<typeof createTestStore>) {
  store.dispatch(clearAnnouncements());
  store.dispatch(clearEvents());
  store.dispatch(nextTurn());
}

describe("game simulation integration", () => {
  describe("turn progression", () => {
    it("should advance through all season rounds", () => {
      const { store } = createGameStore();
      const totalRounds = calendar.length;

      for (let round = 0; round < totalRounds - 1; round++) {
        expect(store.getState().game.turn.round).toBe(round);
        simulateNextTurn(store);
      }

      expect(store.getState().game.turn.round).toBe(totalRounds - 1);
    });

    it("should be able to complete a full season cycle", () => {
      const { store } = createGameStore();
      const totalRounds = calendar.length;

      // Play through all rounds
      for (let round = 0; round < totalRounds; round++) {
        simulateNextTurn(store);
      }

      // Simulate season end
      store.dispatch(seasonEnd());
      expect(store.getState().game.turn.season).toBe(1);
      expect(store.getState().game.turn.round).toBe(-1);

      // nextTurn brings us back to round 0
      store.dispatch(nextTurn());
      expect(store.getState().game.turn.round).toBe(0);
    });
  });

  describe("phase sequence verification", () => {
    it("round 0 should execute startOfSeason + seed", () => {
      const entry = calendar[0];
      expect(entry.phases).toEqual(["startOfSeason", "seed"]);
    });

    it("each round should have a defined phase sequence", () => {
      for (let i = 0; i < calendar.length; i++) {
        const entry = calendar[i];
        expect(entry.phases.length).toBeGreaterThan(0);

        // Each phase should be a known phase name
        const knownPhases = [
          "action",
          "prank",
          "gameday",
          "calculations",
          "eventCreation",
          "event",
          "news",
          "seed",
          "invitations-create",
          "invitations-process",
          "startOfSeason",
          "endOfSeason",
          "gala"
        ];

        for (const phase of entry.phases) {
          expect(knownPhases).toContain(phase);
        }
      }
    });
  });

  describe("season lifecycle", () => {
    it("seasonStart should reset teams for new season", () => {
      const { store } = createGameStore();

      // Apply some effects to a team
      store.dispatch(
        teamAddEffect({
          team: 0,
          effect: { parameter: ["strength"], amount: 5, duration: 3 }
        })
      );
      store.dispatch(
        teamIncrementMorale({
          team: 0,
          amount: 8,
          min: -14,
          max: 12
        })
      );

      expect(store.getState().game.teams[0].effects).toHaveLength(1);
      expect(store.getState().game.teams[0].morale).toBe(8);

      // Season start should reset everything
      store.dispatch(seasonStart());

      expect(store.getState().game.teams[0].effects).toEqual([]);
      expect(store.getState().game.teams[0].morale).toBe(0);
      expect(store.getState().game.teams[0].strategy).toBe(2);
      expect(store.getState().game.teams[0].readiness).toBe(0);
    });

    it("seasonEnd + nextTurn should start fresh season at round 0", () => {
      const { store } = createGameStore();

      store.dispatch(seasonEnd());
      expect(store.getState().game.turn.season).toBe(1);
      expect(store.getState().game.turn.round).toBe(-1);

      simulateNextTurn(store);
      expect(store.getState().game.turn.round).toBe(0);
    });

    it("should support multi-season play", () => {
      const { store } = createGameStore();
      const totalRounds = calendar.length;

      for (let season = 0; season < 3; season++) {
        // Play through season
        for (let round = 0; round < totalRounds; round++) {
          simulateNextTurn(store);
        }

        store.dispatch(seasonEnd());
        expect(store.getState().game.turn.season).toBe(season + 1);
      }

      expect(store.getState().game.turn.season).toBe(3);
    });
  });

  describe("effect lifecycle", () => {
    it("should track effect duration through turns", () => {
      const { store } = createGameStore();

      // Add effect with 3-turn duration
      store.dispatch(
        teamAddEffect({
          team: 0,
          effect: { parameter: ["strength"], amount: 5, duration: 3 }
        })
      );

      expect(store.getState().game.teams[0].effects).toHaveLength(1);
      expect(store.getState().game.teams[0].effects[0].duration).toBe(3);

      // Simulate 3 turns of duration decrement
      store.dispatch(decrementDurations());
      expect(store.getState().game.teams[0].effects[0].duration).toBe(2);

      store.dispatch(decrementDurations());
      expect(store.getState().game.teams[0].effects[0].duration).toBe(1);

      store.dispatch(decrementDurations());
      expect(store.getState().game.teams[0].effects[0].duration).toBe(0);

      // Clear expired should remove the effect
      store.dispatch(clearExpired());
      expect(store.getState().game.teams[0].effects).toHaveLength(0);
    });
  });

  describe("manager-team relationship", () => {
    it("should link manager to team and persist through turns", () => {
      const { store, managerId } = createGameStore();

      // Manager should be assigned to team 12
      expect(store.getState().game.teams[12].manager).toBe(managerId);

      // Advance several turns
      for (let i = 0; i < 5; i++) {
        simulateNextTurn(store);
      }

      // Relationship should persist
      expect(store.getState().game.teams[12].manager).toBe(managerId);
      expect(store.getState().manager.managers[managerId]).toBeDefined();
    });
  });

  describe("state shape invariants", () => {
    it("should always have 12+ domestic teams", () => {
      const { store } = createGameStore();

      for (let round = 0; round < 10; round++) {
        const teams = store.getState().game.teams;
        const domestic = teams.filter((t) => t.domestic);
        expect(domestic.length).toBeGreaterThanOrEqual(12);
        simulateNextTurn(store);
      }
    });

    it("should always have expected competitions", () => {
      const { store } = createGameStore();

      const comps = store.getState().game.competitions;
      expect(comps).toHaveProperty("phl");
      expect(comps).toHaveProperty("division");
      expect(comps).toHaveProperty("ehl");
    });

    it("season counter should never decrease", () => {
      const { store } = createGameStore();
      let maxSeason = 0;

      for (let season = 0; season < 3; season++) {
        for (let round = 0; round < 54; round++) {
          simulateNextTurn(store);
        }
        store.dispatch(seasonEnd());
        const currentSeason = store.getState().game.turn.season;
        expect(currentSeason).toBeGreaterThanOrEqual(maxSeason);
        maxSeason = currentSeason;
      }
    });
  });
});
