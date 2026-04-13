import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { gameMachine } from "@/machines/game";
import type { GameContext } from "@/machines/types";
import type { Competition } from "@/types/competitions";
import type { ManagerServices } from "@/ducks/manager";
import calendar from "@/data/calendar";
import { createTestStore } from "./helpers/createTestStore";
import { syncFromMachine } from "@/ducks/game";
import { deriveGameContext } from "@/stores/sync";

const defaultServices: ManagerServices = {
  coach: false,
  insurance: false,
  microphone: false,
  cheer: false
};

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

describe("bidirectional context sync bridge", () => {
  describe("SYNC_CONTEXT (Redux → XState)", () => {
    it("updates game context fields in the machine", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      const updatedContext = createTestContext({
        turn: { season: 1, round: 3, phase: "action" },
        flags: {
          jarko: true,
          usa: true,
          canada: false,
          haanperaMarried: false,
          mauto: false,
          psycho: 5
        },
        serviceBasePrices: { insurance: 2000 }
      });

      actor.send({ type: "SYNC_CONTEXT", context: updatedContext });

      const ctx = actor.getSnapshot().context;
      // Game context fields should be updated
      expect(ctx.turn).toEqual({ season: 1, round: 3, phase: "action" });
      expect(ctx.flags.jarko).toBe(true);
      expect(ctx.flags.usa).toBe(true);
      expect(ctx.flags.psycho).toBe(5);
      expect(ctx.serviceBasePrices).toEqual({ insurance: 2000 });
    });

    it("preserves machine-internal bookkeeping fields", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      // After START, machine has round 0 phases loaded
      const snapBefore = actor.getSnapshot().context;
      expect(snapBefore.currentPhase).toBe("startOfSeason");
      expect(snapBefore.remainingPhases).toEqual(["seed"]);
      expect(snapBefore.currentRoundCalendar).toBeDefined();
      expect(snapBefore.reduxPhase).toBeUndefined();

      // Send a redux phase so reduxPhase is set
      actor.send({ type: "SYNC_REDUX_PHASE", phase: "select-strategy" });
      expect(actor.getSnapshot().context.reduxPhase).toBe("select-strategy");

      // Send SYNC_CONTEXT with updated game fields.
      // GameContext does NOT include machine-internal fields
      // (currentRoundCalendar, remainingPhases, currentPhase, reduxPhase),
      // so XState's shallow merge leaves them untouched.
      const updatedContext = createTestContext({
        manager: {
          active: "pier-paolo",
          managers: {
            "pier-paolo": {
              id: "pier-paolo",
              name: "Pier Paolo Pasolini",
              difficulty: 2,
              pranksExecuted: 0,
              services: defaultServices,
              balance: 50000,
              arena: { level: 1, name: "Studio Cinecittà" },
              extra: 0,
              insuranceExtra: 0,
              flags: {}
            }
          }
        }
      });

      actor.send({ type: "SYNC_CONTEXT", context: updatedContext });

      const ctx = actor.getSnapshot().context;
      // Machine-internal fields preserved (not part of GameContext)
      expect(ctx.currentPhase).toBe("startOfSeason");
      expect(ctx.remainingPhases).toEqual(["seed"]);
      expect(ctx.currentRoundCalendar).toBeDefined();
      expect(ctx.reduxPhase).toBe("select-strategy");
      // But game context fields were updated
      expect(ctx.manager.active).toBe("pier-paolo");
      expect(ctx.manager.managers["pier-paolo"].name).toBe(
        "Pier Paolo Pasolini"
      );
    });

    it("updates all duck slices", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      const updatedContext = createTestContext({
        betting: {
          bets: [
            { manager: "pp", coupon: ["1", "x", "2"], amount: 100 }
          ],
          championshipBets: []
        },
        event: {
          events: {
            "evt-1": {
              id: "evt-1",
              eventId: "test-event",
              manager: "pp",
              resolved: false,
              processed: false
            }
          }
        },
        news: { news: ["Big news!"], announcements: { pp: ["Announced!"] } },
        notification: {
          notifications: [
            { id: "n1", manager: "pp", message: "Hello", type: "info" }
          ]
        },
        pranks: [{ manager: "pp", type: "spy", victim: 3 }],
        stats: {
          managers: {},
          currentSeason: undefined,
          seasons: [],
          streaks: { team: {}, manager: { pp: { games: 10 } } }
        },
        invitation: {
          invitations: [
            {
              id: "inv-1",
              manager: "pp",
              tournament: 1,
              duration: 3
            }
          ]
        },
        country: { fi: { iso: "fi", name: "Finland", strength: 99 } }
      });

      actor.send({ type: "SYNC_CONTEXT", context: updatedContext });

      const ctx = actor.getSnapshot().context;
      expect(ctx.betting.bets).toHaveLength(1);
      expect(ctx.event.events["evt-1"]).toBeDefined();
      expect(ctx.news.news).toEqual(["Big news!"]);
      expect(ctx.notification.notifications).toHaveLength(1);
      expect(ctx.pranks).toHaveLength(1);
      expect(ctx.stats.streaks.manager).toEqual({ pp: { games: 10 } });
      expect(ctx.invitation.invitations).toHaveLength(1);
      expect(ctx.country.fi.strength).toBe(99);
    });

    it("is ignored in idle state (not playing)", () => {
      const actor = createTestGameActor();

      const updatedContext = createTestContext({
        turn: { season: 5, round: 10, phase: "action" }
      });

      actor.send({ type: "SYNC_CONTEXT", context: updatedContext });

      // Machine should still be in idle, context unchanged
      expect(actor.getSnapshot().value).toBe("idle");
      expect(actor.getSnapshot().context.turn.season).toBe(0);
    });
  });

  describe("SYNC_CONTEXT ordering with PHASE_COMPLETE", () => {
    it("SYNC_CONTEXT before PHASE_COMPLETE keeps context fresh for next phase", () => {
      const actor = createTestGameActor();
      actor.send({ type: "START" });

      // Round 0: ["startOfSeason", "seed"]
      expect(actor.getSnapshot().context.currentPhase).toBe("startOfSeason");

      // Simulate what the sync middleware does: SYNC_CONTEXT then PHASE_COMPLETE
      const freshContext = createTestContext({
        turn: { season: 0, round: 0, phase: "startOfSeason" },
        manager: {
          active: "pp",
          managers: {
            pp: {
              id: "pp",
              name: "Pier Paolo Pasolini",
              difficulty: 2,
              pranksExecuted: 0,
              services: defaultServices,
              balance: 10000,
              arena: { level: 1, name: "Arena" },
              extra: 0,
              insuranceExtra: 0,
              flags: {}
            }
          }
        }
      });

      actor.send({ type: "SYNC_CONTEXT", context: freshContext });
      actor.send({ type: "PHASE_COMPLETE" });

      // Now on "seed" phase with fresh context
      expect(actor.getSnapshot().context.currentPhase).toBe("seed");
      expect(actor.getSnapshot().context.manager.active).toBe("pp");
    });

    it("SYNC_CONTEXT arrives on each phase completion during a full round", () => {
      const actor = createTestGameActor({
        turn: { season: 0, round: 1, phase: undefined }
      });
      actor.send({ type: "START" });

      const round1Phases = calendar[1].phases;
      // Walk through all phases, syncing context between each
      for (let i = 0; i < round1Phases.length; i++) {
        expect(actor.getSnapshot().context.currentPhase).toBe(round1Phases[i]);

        // Simulate sync middleware: update balance as phases progress
        const ctx = createTestContext({
          turn: { season: 0, round: 1, phase: round1Phases[i] },
          manager: {
            active: "pp",
            managers: {
              pp: {
                id: "pp",
                name: "Pier Paolo Pasolini",
                difficulty: 2,
                pranksExecuted: 0,
                services: defaultServices,
                balance: 10000 + (i + 1) * 1000,
                arena: { level: 1, name: "Arena" },
                extra: 0,
                insuranceExtra: 0,
                flags: {}
              }
            }
          }
        });

        actor.send({ type: "SYNC_CONTEXT", context: ctx });
        actor.send({ type: "PHASE_COMPLETE" });
      }

      // Round ended, advanced to round 2
      expect(actor.getSnapshot().context.turn.round).toBe(2);
      // Last sync balance should persist
      expect(
        actor.getSnapshot().context.manager.managers["pp"].balance
      ).toBe(10000 + round1Phases.length * 1000);
    });
  });

  describe("syncFromMachine (XState → Redux)", () => {
    it("updates the game duck slice", () => {
      const store = createTestStore();
      const ctx = createTestContext({
        turn: { season: 2, round: 5, phase: "action" },
        flags: {
          jarko: true,
          usa: false,
          canada: true,
          haanperaMarried: false,
          mauto: false,
          psycho: 3
        },
        serviceBasePrices: { insurance: 5000, coach: 10000 }
      });

      store.dispatch(syncFromMachine(ctx));

      const state = store.getState();
      expect(state.game.turn).toEqual({ season: 2, round: 5, phase: "action" });
      expect(state.game.flags.jarko).toBe(true);
      expect(state.game.flags.canada).toBe(true);
      expect(state.game.flags.psycho).toBe(3);
      expect(state.game.serviceBasePrices).toEqual({
        insurance: 5000,
        coach: 10000
      });
    });

    it("updates the manager duck slice", () => {
      const store = createTestStore();
      const ctx = createTestContext({
        manager: {
          active: "pp",
          managers: {
            pp: {
              id: "pp",
              name: "Pier Paolo Pasolini",
              difficulty: 2,
              pranksExecuted: 3,
              services: { coach: true, insurance: false, microphone: false, cheer: false },
              balance: 99999,
              arena: { level: 5, name: "Colosseum" },
              extra: 10,
              insuranceExtra: 5,
              flags: { rally: true }
            }
          }
        }
      });

      store.dispatch(syncFromMachine(ctx));

      const state = store.getState();
      expect(state.manager.active).toBe("pp");
      expect(state.manager.managers["pp"].balance).toBe(99999);
      expect(state.manager.managers["pp"].arena.name).toBe("Colosseum");
    });

    it("updates the event duck slice", () => {
      const store = createTestStore();
      const ctx = createTestContext({
        event: {
          events: {
            "e1": {
              id: "e1",
              eventId: "test-event",
              manager: "pp",
              resolved: true,
              processed: false
            }
          }
        }
      });

      store.dispatch(syncFromMachine(ctx));

      expect(store.getState().event.events["e1"]).toBeDefined();
      expect(store.getState().event.events["e1"].resolved).toBe(true);
    });

    it("updates the news duck slice", () => {
      const store = createTestStore();
      const ctx = createTestContext({
        news: {
          news: ["Breaking: Pasolini wins!"],
          announcements: { pp: ["New film announced"] }
        }
      });

      store.dispatch(syncFromMachine(ctx));

      expect(store.getState().news.news).toEqual(["Breaking: Pasolini wins!"]);
      expect(store.getState().news.announcements["pp"]).toEqual([
        "New film announced"
      ]);
    });

    it("updates the prank duck slice", () => {
      const store = createTestStore();
      const ctx = createTestContext({
        pranks: [
          { manager: "pp", type: "spy", victim: 7 },
          { manager: "pp", type: "doping", victim: 3 }
        ]
      });

      store.dispatch(syncFromMachine(ctx));

      expect(store.getState().prank.pranks).toHaveLength(2);
      expect(store.getState().prank.pranks[0].type).toBe("spy");
    });

    it("updates the stats duck slice", () => {
      const store = createTestStore();
      const ctx = createTestContext({
        stats: {
          managers: {
            pp: {
              games: {
                phl: { "team-5": { win: 3, draw: 1, loss: 2 } }
              }
            }
          },
          currentSeason: undefined,
          seasons: [],
          streaks: { team: {}, manager: {} }
        }
      });

      store.dispatch(syncFromMachine(ctx));

      expect(
        store.getState().stats.managers["pp"].games["phl"]["team-5"].win
      ).toBe(3);
    });

    it("updates the betting duck slice", () => {
      const store = createTestStore();
      const ctx = createTestContext({
        betting: {
          bets: [
            { manager: "pp", coupon: ["1", "x"], amount: 500 }
          ],
          championshipBets: [{ manager: "pp", team: 5, amount: 1000, odds: 3.5 }]
        }
      });

      store.dispatch(syncFromMachine(ctx));

      expect(store.getState().betting.bets).toHaveLength(1);
      expect(store.getState().betting.championshipBets).toHaveLength(1);
    });

    it("updates the invitation duck slice", () => {
      const store = createTestStore();
      const ctx = createTestContext({
        invitation: {
          invitations: [
            { id: "inv-1", manager: "pp", tournament: 2, duration: 5 }
          ]
        }
      });

      store.dispatch(syncFromMachine(ctx));

      expect(store.getState().invitation.invitations).toHaveLength(1);
      expect(store.getState().invitation.invitations[0].tournament).toBe(2);
    });

    it("updates the country duck slice", () => {
      const store = createTestStore();
      const ctx = createTestContext({
        country: {
          fi: { iso: "fi", name: "Finland", strength: 88 },
          se: { iso: "se", name: "Sweden", strength: 92 }
        }
      });

      store.dispatch(syncFromMachine(ctx));

      expect(store.getState().country.countries["fi"].strength).toBe(88);
      expect(store.getState().country.countries["se"].strength).toBe(92);
    });

    it("updates the notification duck slice", () => {
      const store = createTestStore();
      const ctx = createTestContext({
        notification: {
          notifications: [
            { id: "n1", manager: "pp", message: "Goal!", type: "success" }
          ]
        }
      });

      store.dispatch(syncFromMachine(ctx));

      expect(store.getState().notification.notifications).toHaveLength(1);
      expect(store.getState().notification.notifications[0].message).toBe(
        "Goal!"
      );
    });

    it("does not affect meta duck (not part of GameContext)", () => {
      const store = createTestStore();
      const metaBefore = store.getState().meta;

      store.dispatch(syncFromMachine(createTestContext()));

      expect(store.getState().meta).toEqual(metaBefore);
    });

    it("does not affect ui duck (not part of GameContext)", () => {
      const store = createTestStore();
      const uiBefore = store.getState().ui;

      store.dispatch(syncFromMachine(createTestContext()));

      expect(store.getState().ui).toEqual(uiBefore);
    });
  });

  describe("round-trip: Redux → machine → Redux", () => {
    it("preserves data through a full round-trip", () => {
      // 1. Create a Redux store with initial state
      const store = createTestStore();

      // 2. Derive a GameContext from it
      const ctx = deriveGameContext(store.getState());

      // 3. Create a game actor with that context
      const actor = createActor(gameMachine, { input: ctx });
      actor.start();
      actor.send({ type: "START" });

      // 4. Machine is now running — sync context back
      const machineCtx = actor.getSnapshot().context;

      // 5. Build a GameContext from the machine context (strip machine-internal fields)
      const gameCtx: GameContext = {
        turn: machineCtx.turn,
        flags: machineCtx.flags,
        serviceBasePrices: machineCtx.serviceBasePrices,
        managers: machineCtx.managers,
        competitions: machineCtx.competitions,
        teams: machineCtx.teams,
        worldChampionshipResults: machineCtx.worldChampionshipResults,
        manager: machineCtx.manager,
        betting: machineCtx.betting,
        event: machineCtx.event,
        news: machineCtx.news,
        notification: machineCtx.notification,
        pranks: machineCtx.pranks,
        stats: machineCtx.stats,
        invitation: machineCtx.invitation,
        country: machineCtx.country
      };

      // 6. Dispatch syncFromMachine to push machine context → Redux
      store.dispatch(syncFromMachine(gameCtx));

      // 7. Derive again from Redux
      const roundTripped = deriveGameContext(store.getState());

      // 8. Compare: the round-tripped context should match the original
      // (turn.round may have advanced from machine's round management,
      // so compare the fields we care about)
      expect(roundTripped.flags).toEqual(ctx.flags);
      expect(roundTripped.serviceBasePrices).toEqual(ctx.serviceBasePrices);
      expect(roundTripped.manager).toEqual(ctx.manager);
      expect(roundTripped.betting).toEqual(ctx.betting);
      expect(roundTripped.event).toEqual(ctx.event);
      expect(roundTripped.news).toEqual(ctx.news);
      expect(roundTripped.notification).toEqual(ctx.notification);
      expect(roundTripped.pranks).toEqual(ctx.pranks);
      expect(roundTripped.stats).toEqual(ctx.stats);
      expect(roundTripped.invitation).toEqual(ctx.invitation);

      actor.stop();
    });

    it("multiple sync cycles maintain consistency", () => {
      const actor = createTestGameActor({
        turn: { season: 0, round: 1, phase: undefined }
      });
      actor.send({ type: "START" });

      const round1Phases = calendar[1].phases;

      // Simulate 3 phase completions with context sync
      for (let i = 0; i < Math.min(3, round1Phases.length); i++) {
        // Create a context that changes each time (simulating saga mutations)
        const ctx = createTestContext({
          turn: { season: 0, round: 1, phase: round1Phases[i] },
          news: {
            news: Array.from({ length: i + 1 }, (_, j) => `News ${j}`),
            announcements: {}
          }
        });

        actor.send({ type: "SYNC_CONTEXT", context: ctx });
        actor.send({ type: "PHASE_COMPLETE" });

        // After SYNC_CONTEXT, the machine should have the latest news
        // (SYNC_CONTEXT happens before PHASE_COMPLETE, so the news from the
        // last sync should still be visible)
        const machineNews = actor.getSnapshot().context.news.news;
        expect(machineNews).toHaveLength(i + 1);
      }
    });
  });

  describe("deriveGameContext", () => {
    it("correctly maps all RootState slices to GameContext fields", () => {
      const store = createTestStore();
      const ctx = deriveGameContext(store.getState());

      // Verify all expected fields exist
      expect(ctx.turn).toBeDefined();
      expect(ctx.flags).toBeDefined();
      expect(ctx.serviceBasePrices).toBeDefined();
      expect(ctx.managers).toBeDefined();
      expect(ctx.competitions).toBeDefined();
      expect(ctx.teams).toBeDefined();
      expect(ctx.manager).toBeDefined();
      expect(ctx.betting).toBeDefined();
      expect(ctx.event).toBeDefined();
      expect(ctx.news).toBeDefined();
      expect(ctx.notification).toBeDefined();
      expect(ctx.pranks).toBeDefined();
      expect(ctx.stats).toBeDefined();
      expect(ctx.invitation).toBeDefined();
      expect(ctx.country).toBeDefined();
    });

    it("maps prank duck shape correctly (state.prank.pranks → pranks)", () => {
      const store = createTestStore();
      const ctx = deriveGameContext(store.getState());
      expect(ctx.pranks).toEqual([]);
    });

    it("maps country duck shape correctly (state.country.countries → country)", () => {
      const store = createTestStore();
      const ctx = deriveGameContext(store.getState());
      expect(typeof ctx.country).toBe("object");
      // Should have country entries from the initial country data
      expect(Object.keys(ctx.country).length).toBeGreaterThan(0);
    });
  });
});
