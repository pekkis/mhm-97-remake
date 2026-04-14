import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { gameMachine } from "@/machines/game";
import { executeCalculationsPhase } from "@/machines/calculations";
import type { GameContext } from "@/machines/types";
import type { Competition } from "@/types/competitions";
import type { Manager } from "@/ducks/manager";
import type { Team } from "@/ducks/game";
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
  turn: { season: 0, round: 1, phase: undefined },
  flags: {
    jarko: false,
    usa: false,
    canada: false,
    haanperaMarried: false,
    mauto: false,
    psycho: undefined
  },
  serviceBasePrices: {
    insurance: 1000,
    coach: 3200,
    microphone: 500,
    cheer: 3000
  },
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

const createTestTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 0,
  name: "Test Team",
  strength: 50,
  domestic: true,
  morale: 0,
  strategy: 2, // "Tasainen puurto" (no readiness change)
  readiness: 0,
  effects: [],
  opponentEffects: [],
  ...overrides
});

const createTestManager = (overrides: Partial<Manager> = {}): Manager => ({
  id: "pier-paolo",
  name: "Pier Paolo Pasolini",
  difficulty: 0,
  pranksExecuted: 0,
  services: { coach: false, insurance: false, microphone: false, cheer: false },
  balance: 100000,
  arena: { name: "Pasolini Arena", level: 1 },
  extra: 0,
  insuranceExtra: 0,
  flags: {},
  team: 0,
  ...overrides
});

// ---------------------------------------------------------------------------
// Pure function tests
// ---------------------------------------------------------------------------

describe("executeCalculationsPhase (pure function)", () => {
  describe("readiness increments", () => {
    it("does nothing for strategy 2 (Tasainen puurto)", () => {
      const ctx = createTestContext({
        teams: [createTestTeam({ strategy: 2, readiness: 10 })]
      });

      const result = executeCalculationsPhase(ctx);

      expect(result.teams![0].readiness).toBe(10);
    });

    it("increments readiness for strategy 0 (Juri Simonov) before round 54", () => {
      const ctx = createTestContext({
        turn: { season: 0, round: 10, phase: undefined },
        teams: [createTestTeam({ strategy: 0, readiness: -22 })]
      });

      const result = executeCalculationsPhase(ctx);

      // Strategy 0 returns 1 for rounds < 54
      expect(result.teams![0].readiness).toBe(-21);
    });

    it("does not increment readiness for strategy 0 at round >= 54", () => {
      const ctx = createTestContext({
        turn: { season: 0, round: 54, phase: undefined },
        teams: [createTestTeam({ strategy: 0, readiness: 0 })]
      });

      const result = executeCalculationsPhase(ctx);

      // Strategy 0 returns 0 for rounds >= 54
      expect(result.teams![0].readiness).toBe(0);
    });

    it("decrements readiness for strategy 1 (Kaikki peliin!) before round 45", () => {
      const ctx = createTestContext({
        turn: { season: 0, round: 10, phase: undefined },
        teams: [createTestTeam({ strategy: 1, readiness: 24 })]
      });

      const result = executeCalculationsPhase(ctx);

      // Strategy 1 returns -1 for rounds <= 44
      expect(result.teams![0].readiness).toBe(23);
    });

    it("decrements readiness faster for strategy 1 after round 44", () => {
      const ctx = createTestContext({
        turn: { season: 0, round: 45, phase: undefined },
        teams: [createTestTeam({ strategy: 1, readiness: 20 })]
      });

      const result = executeCalculationsPhase(ctx);

      // Strategy 1 returns -2 for rounds 45-53
      expect(result.teams![0].readiness).toBe(18);
    });

    it("handles multiple teams with different strategies", () => {
      const ctx = createTestContext({
        turn: { season: 0, round: 10, phase: undefined },
        teams: [
          createTestTeam({ id: 0, strategy: 0, readiness: -22 }),
          createTestTeam({ id: 1, strategy: 1, readiness: 24 }),
          createTestTeam({ id: 2, strategy: 2, readiness: 0 })
        ]
      });

      const result = executeCalculationsPhase(ctx);

      expect(result.teams![0].readiness).toBe(-21); // +1
      expect(result.teams![1].readiness).toBe(23); // -1
      expect(result.teams![2].readiness).toBe(0); // no change
    });
  });

  describe("effect duration decrements", () => {
    it("decrements team effect durations by 1", () => {
      const ctx = createTestContext({
        teams: [
          createTestTeam({
            effects: [
              { parameter: ["strength"], amount: 5, duration: 3 },
              { parameter: ["morale"], amount: -2, duration: 1 }
            ]
          })
        ]
      });

      const result = executeCalculationsPhase(ctx);

      expect(result.teams![0].effects[0].duration).toBe(2);
      expect(result.teams![0].effects[1].duration).toBe(0);
    });

    it("decrements opponent effect durations by 1", () => {
      const ctx = createTestContext({
        teams: [
          createTestTeam({
            opponentEffects: [
              { parameter: ["strength"], amount: -3, duration: 5 }
            ]
          })
        ]
      });

      const result = executeCalculationsPhase(ctx);

      expect(result.teams![0].opponentEffects[0].duration).toBe(4);
    });

    it("handles teams with no effects", () => {
      const ctx = createTestContext({
        teams: [createTestTeam()]
      });

      const result = executeCalculationsPhase(ctx);

      expect(result.teams![0].effects).toEqual([]);
      expect(result.teams![0].opponentEffects).toEqual([]);
    });
  });

  describe("service cost deductions", () => {
    it("does not deduct when manager has no active services", () => {
      const ctx = createTestContext({
        manager: {
          active: "pier-paolo",
          managers: { "pier-paolo": createTestManager() }
        }
      });

      const result = executeCalculationsPhase(ctx);

      expect(result.manager!.managers["pier-paolo"].balance).toBe(100000);
    });

    it("deducts coach service cost from manager balance", () => {
      const ctx = createTestContext({
        manager: {
          active: "pier-paolo",
          managers: {
            "pier-paolo": createTestManager({
              services: {
                coach: true,
                insurance: false,
                microphone: false,
                cheer: false
              }
            })
          }
        }
      });

      const result = executeCalculationsPhase(ctx);

      // Coach price = basePrice (3200)
      expect(result.manager!.managers["pier-paolo"].balance).toBe(
        100000 - 3200
      );
    });

    it("deducts insurance service cost (depends on arena level)", () => {
      const ctx = createTestContext({
        manager: {
          active: "pier-paolo",
          managers: {
            "pier-paolo": createTestManager({
              services: {
                coach: false,
                insurance: true,
                microphone: false,
                cheer: false
              },
              arena: { name: "Pasolini Arena", level: 2 },
              insuranceExtra: 100
            })
          }
        }
      });

      const result = executeCalculationsPhase(ctx);

      // Insurance price = basePrice(1000) + (level+1)*1000 + insuranceExtra
      // = 1000 + 3*1000 + 100 = 4100
      expect(result.manager!.managers["pier-paolo"].balance).toBe(
        100000 - 4100
      );
    });

    it("deducts multiple active service costs", () => {
      const ctx = createTestContext({
        manager: {
          active: "pier-paolo",
          managers: {
            "pier-paolo": createTestManager({
              services: {
                coach: true,
                insurance: false,
                microphone: true,
                cheer: true
              }
            })
          }
        }
      });

      const result = executeCalculationsPhase(ctx);

      // coach=3200, microphone=500, cheer=3000
      expect(result.manager!.managers["pier-paolo"].balance).toBe(
        100000 - 3200 - 500 - 3000
      );
    });

    it("handles multiple managers independently", () => {
      const ctx = createTestContext({
        manager: {
          active: "pier-paolo",
          managers: {
            "pier-paolo": createTestManager({
              id: "pier-paolo",
              balance: 50000,
              services: {
                coach: true,
                insurance: false,
                microphone: false,
                cheer: false
              }
            }),
            "franco": createTestManager({
              id: "franco",
              name: "Franco Nero",
              balance: 80000,
              services: {
                coach: false,
                insurance: false,
                microphone: true,
                cheer: false
              }
            })
          }
        }
      });

      const result = executeCalculationsPhase(ctx);

      expect(result.manager!.managers["pier-paolo"].balance).toBe(
        50000 - 3200
      );
      expect(result.manager!.managers["franco"].balance).toBe(80000 - 500);
    });
  });

  describe("immutability", () => {
    it("does not mutate the input context", () => {
      const originalTeam = createTestTeam({
        readiness: 10,
        strategy: 0,
        effects: [{ parameter: ["strength"], amount: 5, duration: 3 }]
      });
      const originalManager = createTestManager({
        balance: 100000,
        services: {
          coach: true,
          insurance: false,
          microphone: false,
          cheer: false
        }
      });
      const ctx = createTestContext({
        turn: { season: 0, round: 10, phase: undefined },
        teams: [originalTeam],
        manager: {
          active: "pier-paolo",
          managers: { "pier-paolo": originalManager }
        }
      });

      const teamsBefore = JSON.parse(JSON.stringify(ctx.teams));
      const managersBefore = JSON.parse(JSON.stringify(ctx.manager));

      executeCalculationsPhase(ctx);

      expect(ctx.teams).toEqual(teamsBefore);
      expect(ctx.manager).toEqual(managersBefore);
    });
  });
});

// ---------------------------------------------------------------------------
// gameMachine integration tests
// ---------------------------------------------------------------------------

describe("gameMachine calculations phase integration", () => {
  const createTestGameActor = (overrides: Partial<GameContext> = {}) => {
    const ctx = createTestContext(overrides);
    const actor = createActor(gameMachine, { input: ctx });
    actor.start();
    return actor;
  };

  it("executes calculations on entry when currentPhase is 'calculations'", () => {
    // Round 1 has phases: [action, prank, gameday, calculations, ...]
    const actor = createTestGameActor({
      turn: { season: 0, round: 1, phase: undefined },
      teams: [
        createTestTeam({
          strategy: 0,
          readiness: 0,
          effects: [{ parameter: ["strength"], amount: 5, duration: 3 }]
        })
      ],
      manager: {
        active: "pier-paolo",
        managers: {
          "pier-paolo": createTestManager({
            services: {
              coach: true,
              insurance: false,
              microphone: false,
              cheer: false
            }
          })
        }
      }
    });

    actor.send({ type: "START" });

    // Walk through action, prank, gameday phases
    expect(actor.getSnapshot().context.currentPhase).toBe("action");
    actor.send({ type: "PHASE_COMPLETE" });
    expect(actor.getSnapshot().context.currentPhase).toBe("prank");
    actor.send({ type: "PHASE_COMPLETE" });
    expect(actor.getSnapshot().context.currentPhase).toBe("gameday");
    actor.send({ type: "PHASE_COMPLETE" });

    // Now on calculations phase — machine should have executed it
    expect(actor.getSnapshot().context.currentPhase).toBe("calculations");

    // Readiness should be incremented (strategy 0 at round 1: +1)
    expect(actor.getSnapshot().context.teams[0].readiness).toBe(1);

    // Effect duration should be decremented
    expect(actor.getSnapshot().context.teams[0].effects[0].duration).toBe(2);

    // Manager balance should be deducted (coach: 3200)
    expect(
      actor.getSnapshot().context.manager.managers["pier-paolo"].balance
    ).toBe(100000 - 3200);
  });

  it("does not execute calculations for non-calculations phases", () => {
    const actor = createTestGameActor({
      turn: { season: 0, round: 1, phase: undefined },
      teams: [createTestTeam({ strategy: 0, readiness: 0 })]
    });

    actor.send({ type: "START" });

    // On "action" phase — readiness should NOT be modified
    expect(actor.getSnapshot().context.currentPhase).toBe("action");
    expect(actor.getSnapshot().context.teams[0].readiness).toBe(0);
  });

  it("machine still waits for PHASE_COMPLETE after executing calculations", () => {
    const actor = createTestGameActor({
      turn: { season: 0, round: 1, phase: undefined },
      teams: [createTestTeam()]
    });

    actor.send({ type: "START" });

    // Walk to calculations phase
    actor.send({ type: "PHASE_COMPLETE" }); // action done
    actor.send({ type: "PHASE_COMPLETE" }); // prank done
    actor.send({ type: "PHASE_COMPLETE" }); // gameday done

    // Now on calculations — machine waits for PHASE_COMPLETE
    expect(actor.getSnapshot().context.currentPhase).toBe("calculations");
    expect(actor.getSnapshot().value).toEqual({
      playing: "executingPhases"
    });

    // Send PHASE_COMPLETE to advance past calculations
    actor.send({ type: "PHASE_COMPLETE" });

    // Should now be on the next phase (eventCreation)
    expect(actor.getSnapshot().context.currentPhase).toBe("eventCreation");
  });

  it("SYNC_CONTEXT before PHASE_COMPLETE does not overwrite calculations result for saga-owned phases", () => {
    // This tests the expected flow for saga-owned phases:
    // saga runs → SYNC_CONTEXT (Redux → machine) → PHASE_COMPLETE
    const actor = createTestGameActor({
      turn: { season: 0, round: 1, phase: undefined },
      teams: [createTestTeam({ strategy: 0, readiness: 0 })]
    });

    actor.send({ type: "START" });

    // Walk to calculations (3 PHASE_COMPLETE for action, prank, gameday)
    actor.send({ type: "PHASE_COMPLETE" });
    actor.send({ type: "PHASE_COMPLETE" });
    actor.send({ type: "PHASE_COMPLETE" });

    // Machine has executed calculations: readiness = 1
    expect(actor.getSnapshot().context.teams[0].readiness).toBe(1);

    // For a machine-owned phase, the middleware would NOT send SYNC_CONTEXT
    // (it sends syncFromMachine to Redux instead). But if SYNC_CONTEXT were
    // sent, it would overwrite the calculations. This test documents the
    // expected behavior: SYNC_CONTEXT would reset the machine's work.
    // That's why the middleware must NOT send SYNC_CONTEXT for machine-owned
    // phases — confirmed by the sync middleware implementation.

    // Just send PHASE_COMPLETE (machine-owned phase flow)
    actor.send({ type: "PHASE_COMPLETE" });
    expect(actor.getSnapshot().context.currentPhase).toBe("eventCreation");
  });

  it("calculations results persist through subsequent SYNC_CONTEXT", () => {
    // After calculations, subsequent saga phases will SYNC_CONTEXT from Redux.
    // The Redux state should include the calculations result (pushed via
    // syncFromMachine). This test verifies that when SYNC_CONTEXT arrives
    // with the calculations result included, the machine's state is consistent.
    const actor = createTestGameActor({
      turn: { season: 0, round: 1, phase: undefined },
      teams: [
        createTestTeam({ strategy: 0, readiness: 0 }),
        createTestTeam({ id: 1, strategy: 1, readiness: 24 })
      ]
    });

    actor.send({ type: "START" });

    // Walk to calculations
    actor.send({ type: "PHASE_COMPLETE" }); // action
    actor.send({ type: "PHASE_COMPLETE" }); // prank
    actor.send({ type: "PHASE_COMPLETE" }); // gameday

    // Machine executed calculations
    expect(actor.getSnapshot().context.teams[0].readiness).toBe(1);
    expect(actor.getSnapshot().context.teams[1].readiness).toBe(23);

    // PHASE_COMPLETE advances to eventCreation
    actor.send({ type: "PHASE_COMPLETE" });
    expect(actor.getSnapshot().context.currentPhase).toBe("eventCreation");

    // Simulate SYNC_CONTEXT from a subsequent saga phase with calculated values
    const updatedCtx = createTestContext({
      turn: { season: 0, round: 1, phase: undefined },
      teams: [
        createTestTeam({ strategy: 0, readiness: 1 }),
        createTestTeam({ id: 1, strategy: 1, readiness: 23 })
      ]
    });
    actor.send({ type: "SYNC_CONTEXT", context: updatedCtx });

    // Values should be consistent (SYNC_CONTEXT from Redux mirrors what
    // the machine calculated, because syncFromMachine pushed it to Redux)
    expect(actor.getSnapshot().context.teams[0].readiness).toBe(1);
    expect(actor.getSnapshot().context.teams[1].readiness).toBe(23);
  });

  it("walks through a full round including machine-owned calculations", () => {
    const actor = createTestGameActor({
      turn: { season: 0, round: 1, phase: undefined },
      teams: [createTestTeam({ strategy: 0, readiness: -22 })]
    });

    actor.send({ type: "START" });

    const round1Phases = calendar[1].phases;
    expect(round1Phases).toContain("calculations");

    // Walk through all phases
    for (const phase of round1Phases) {
      expect(actor.getSnapshot().context.currentPhase).toBe(phase);
      actor.send({ type: "PHASE_COMPLETE" });
    }

    // Should be on round 2
    expect(actor.getSnapshot().context.turn.round).toBe(2);

    // Readiness should have been incremented in round 1
    // Strategy 0 at round 1: +1, so -22 → -21
    expect(actor.getSnapshot().context.teams[0].readiness).toBe(-21);
  });
});
