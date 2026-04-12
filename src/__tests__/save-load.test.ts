import { describe, it, expect } from "vitest";
import { createTestStore } from "./helpers/createTestStore";
import { gameLoadState } from "../ducks/meta";
import {
  nextTurn,
  setGamePhase,
  teamIncrementStrength,
  teamAddEffect
} from "../ducks/game";
import { managerAdd, managerSetActive } from "../ducks/manager";
import { addEventAction } from "../ducks/event";

describe("save/load round-trip", () => {
  it("should serialize and deserialize state without loss", () => {
    const store = createTestStore();
    const originalState = store.getState();

    // Simulate save: JSON round-trip
    const json = JSON.stringify(originalState);
    const parsed = JSON.parse(json);

    // Simulate load: create new store and load state
    const store2 = createTestStore();
    store2.dispatch(gameLoadState(parsed));

    // All slices that handle gameLoadState should match
    expect(store2.getState().game).toEqual(originalState.game);
    expect(store2.getState().manager).toEqual(originalState.manager);
    expect(store2.getState().event).toEqual(originalState.event);
    expect(store2.getState().news).toEqual(originalState.news);
    expect(store2.getState().prank).toEqual(originalState.prank);
    expect(store2.getState().betting).toEqual(originalState.betting);
    expect(store2.getState().stats).toEqual(originalState.stats);
    expect(store2.getState().invitation).toEqual(originalState.invitation);
  });

  it("should preserve state after modifications + round-trip", () => {
    const store = createTestStore();

    // Simulate some game activity
    store.dispatch(
      managerAdd({
        manager: {
          id: "pasolini",
          name: "Pier Paolo Pasolini",
          difficulty: 2,
          pranksExecuted: 0,
          services: {
            coach: true,
            insurance: false,
            microphone: true,
            cheer: false
          },
          balance: 150000,
          arena: { name: "Cinema Paradiso", level: 3 },
          extra: 2000,
          insuranceExtra: 0,
          flags: { rally: true }
        }
      })
    );
    store.dispatch(managerSetActive("pasolini"));

    store.dispatch(nextTurn());
    store.dispatch(nextTurn());
    store.dispatch(nextTurn());
    store.dispatch(setGamePhase("action"));

    store.dispatch(teamIncrementStrength({ team: 5, amount: 12 }));
    store.dispatch(
      teamAddEffect({
        team: 5,
        effect: { parameter: ["strength"], amount: 3, duration: 5 }
      })
    );

    store.dispatch(
      addEventAction({
        event: {
          eventId: "test-event",
          manager: "pasolini",
          resolved: false
        }
      })
    );

    const modifiedState = store.getState();

    // Save/load round-trip
    const json = JSON.stringify(modifiedState);
    const parsed = JSON.parse(json);

    const store2 = createTestStore();
    store2.dispatch(gameLoadState(parsed));

    // Verify key modifications survived
    expect(store2.getState().game.turn.round).toBe(3);
    expect(store2.getState().game.turn.phase).toBe("action");
    expect(store2.getState().manager.active).toBe("pasolini");
    expect(store2.getState().manager.managers["pasolini"].balance).toBe(150000);
    expect(store2.getState().manager.managers["pasolini"].services.coach).toBe(
      true
    );
    expect(store2.getState().game.teams[5].effects).toHaveLength(1);
    expect(
      Object.keys(store2.getState().event.events).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("should handle empty state round-trip gracefully", () => {
    const store = createTestStore();
    const state = store.getState();

    // Multiple round-trips should be idempotent
    const json1 = JSON.stringify(state);
    const parsed1 = JSON.parse(json1);
    const json2 = JSON.stringify(parsed1);

    expect(json1).toBe(json2);
  });
});
