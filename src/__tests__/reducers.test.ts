import { describe, it, expect, beforeEach } from "vitest";
import { createTestStore, type TestStore } from "./helpers/createTestStore";
import {
  nextTurn,
  seasonStart,
  seasonEnd,
  clearExpired,
  decrementDurations,
  setGamePhase,
  setGameFlag,
  teamAddEffect,
  teamIncrementMorale,
  teamSetStrategy,
  teamSetReadiness,
  teamIncrementStrength,
  teamDecrementStrength,
  teamAddManager,
  teamRemoveManager
} from "../ducks/game";
import { gameLoadState, quitToMainMenu, startGame } from "../ducks/meta";
import { managerAdd } from "../ducks/manager";
import { addEventAction, clearEvents } from "../ducks/event";
import { addNotification, dismissNotification } from "../ducks/notification";
import { toggleMenu, closeMenu } from "../ducks/ui";
import { addNews } from "../ducks/news";

describe("reducer unit tests", () => {
  let store: TestStore;

  beforeEach(() => {
    store = createTestStore();
  });

  describe("game: nextTurn", () => {
    it("should increment round by 1", () => {
      expect(store.getState().game.turn.round).toBe(0);
      store.dispatch(nextTurn());
      expect(store.getState().game.turn.round).toBe(1);
    });

    it("should increment round multiple times", () => {
      for (let i = 0; i < 10; i++) {
        store.dispatch(nextTurn());
      }
      expect(store.getState().game.turn.round).toBe(10);
    });
  });

  describe("game: seasonStart", () => {
    it("should reset all team effects, morale, strategy, and readiness", () => {
      // Set up some state first
      store.dispatch(
        teamAddEffect({
          team: 0,
          effect: { parameter: ["strength"], amount: 5, duration: 3 }
        })
      );
      store.dispatch(
        teamIncrementMorale({ team: 0, amount: 5, min: -20, max: 20 })
      );

      store.dispatch(seasonStart());

      const team = store.getState().game.teams[0];
      expect(team.effects).toEqual([]);
      expect(team.opponentEffects).toEqual([]);
      expect(team.morale).toBe(0);
      expect(team.strategy).toBe(2);
      expect(team.readiness).toBe(0);
    });

    it("should reset jarko flag", () => {
      store.dispatch(setGameFlag({ flag: "jarko", value: true }));
      expect(store.getState().game.flags.jarko).toBe(true);

      store.dispatch(seasonStart());
      expect(store.getState().game.flags.jarko).toBe(false);
    });

    it("should clear competition phases", () => {
      store.dispatch(seasonStart());

      const comps = store.getState().game.competitions;
      for (const comp of Object.values(comps)) {
        expect(comp.phases).toEqual([]);
        expect(comp.phase).toBe(-1);
      }
    });
  });

  describe("game: seasonEnd", () => {
    it("should increment season and set round to -1", () => {
      expect(store.getState().game.turn.season).toBe(0);
      store.dispatch(seasonEnd());
      expect(store.getState().game.turn.season).toBe(1);
      expect(store.getState().game.turn.round).toBe(-1);
    });
  });

  describe("game: clearExpired", () => {
    it("should remove effects with duration <= 0", () => {
      store.dispatch(
        teamAddEffect({
          team: 0,
          effect: { parameter: ["strength"], amount: 5, duration: 1 }
        })
      );
      store.dispatch(
        teamAddEffect({
          team: 0,
          effect: { parameter: ["morale"], amount: 3, duration: 0 }
        })
      );

      store.dispatch(clearExpired());

      const team = store.getState().game.teams[0];
      expect(team.effects).toHaveLength(1);
      expect(team.effects[0].parameter).toEqual(["strength"]);
    });
  });

  describe("game: decrementDurations", () => {
    it("should decrement duration of all effects", () => {
      store.dispatch(
        teamAddEffect({
          team: 0,
          effect: { parameter: ["strength"], amount: 5, duration: 3 }
        })
      );
      store.dispatch(
        teamAddEffect({
          team: 0,
          effect: { parameter: ["morale"], amount: 2, duration: 1 }
        })
      );

      store.dispatch(decrementDurations());

      const team = store.getState().game.teams[0];
      expect(team.effects[0].duration).toBe(2);
      expect(team.effects[1].duration).toBe(0);
    });
  });

  describe("game: phase management", () => {
    it("setGamePhase should set current phase", () => {
      store.dispatch(setGamePhase("action"));
      expect(store.getState().game.turn.phase).toBe("action");

      store.dispatch(setGamePhase("gameday"));
      expect(store.getState().game.turn.phase).toBe("gameday");
    });
  });

  describe("game: flags", () => {
    it("should set and read flags", () => {
      store.dispatch(setGameFlag({ flag: "usa", value: true }));
      expect(store.getState().game.flags.usa).toBe(true);

      store.dispatch(setGameFlag({ flag: "psycho", value: 5 }));
      expect(store.getState().game.flags.psycho).toBe(5);
    });
  });

  describe("game: team mutations", () => {
    it("should increment and decrement strength", () => {
      const initialStrength = store.getState().game.teams[0].strength;

      store.dispatch(teamIncrementStrength({ team: 0, amount: 10 }));
      expect(store.getState().game.teams[0].strength).toBe(
        initialStrength + 10
      );

      store.dispatch(teamDecrementStrength({ team: 0, amount: 3 }));
      expect(store.getState().game.teams[0].strength).toBe(initialStrength + 7);
    });

    it("should clamp morale within min/max bounds", () => {
      store.dispatch(
        teamIncrementMorale({ team: 0, amount: 100, min: -10, max: 12 })
      );
      expect(store.getState().game.teams[0].morale).toBe(12);

      store.dispatch(
        teamIncrementMorale({ team: 0, amount: -200, min: -10, max: 12 })
      );
      expect(store.getState().game.teams[0].morale).toBe(-10);
    });

    it("should set strategy and readiness", () => {
      store.dispatch(teamSetStrategy({ team: 0, strategy: 4 }));
      expect(store.getState().game.teams[0].strategy).toBe(4);

      store.dispatch(teamSetReadiness({ team: 0, readiness: 75 }));
      expect(store.getState().game.teams[0].readiness).toBe(75);
    });

    it("should add and remove manager from team", () => {
      // Need to add a manager to the manager state first
      store.dispatch(
        managerAdd({
          manager: {
            id: "test-mgr-id",
            name: "Test Manager",
            difficulty: 2,
            pranksExecuted: 0,
            services: {
              coach: false,
              insurance: false,
              microphone: false,
              cheer: false
            },
            balance: 0,
            arena: { name: "Test Arena", level: 1 },
            extra: 0,
            insuranceExtra: 0,
            flags: {}
          }
        })
      );

      store.dispatch(teamAddManager({ team: 0, manager: "test-mgr-id" }));
      expect(store.getState().game.teams[0].manager).toBe("test-mgr-id");

      store.dispatch(teamRemoveManager({ team: 0 }));
      expect(store.getState().game.teams[0].manager).toBeUndefined();
    });
  });

  describe("meta: game lifecycle", () => {
    it("startGame should set starting=true", () => {
      store.dispatch(startGame());
      expect(store.getState().meta.starting).toBe(true);
    });

    it("quitToMainMenu should reset meta state", () => {
      store.dispatch(quitToMainMenu());
      const meta = store.getState().meta;
      expect(meta.started).toBe(false);
      expect(meta.loading).toBe(false);
      expect(meta.starting).toBe(false);
    });

    it("gameStart should set started=true via SEASON_START matcher", () => {
      store.dispatch(seasonStart());
      expect(store.getState().meta.started).toBe(true);
    });
  });

  describe("manager slice", () => {
    it("should add a manager", () => {
      const manager = {
        id: "test-id",
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
        arena: { name: "Test Arena", level: 3 },
        extra: 0,
        insuranceExtra: 0,
        flags: {}
      };

      store.dispatch(managerAdd({ manager }));

      const state = store.getState().manager;
      expect(state.managers["test-id"]).toBeDefined();
      expect(state.managers["test-id"].name).toBe("Pier Paolo Pasolini");
    });
  });

  describe("event slice", () => {
    it("should add and clear events", () => {
      store.dispatch(
        addEventAction({
          event: {
            eventId: "test-event",
            manager: "mgr-1",
            resolved: false
          }
        })
      );

      const events = store.getState().event.events;
      const eventIds = Object.keys(events);
      expect(eventIds).toHaveLength(1);

      const event = events[eventIds[0]];
      expect(event.eventId).toBe("test-event");
      expect(event.resolved).toBe(false);

      store.dispatch(clearEvents());
      expect(Object.keys(store.getState().event.events)).toHaveLength(0);
    });
  });

  describe("notification slice", () => {
    it("should add notifications up to max 3", () => {
      for (let i = 0; i < 5; i++) {
        store.dispatch(
          addNotification({
            id: `n-${i}`,
            manager: "mgr-1",
            message: `Notification ${i}`,
            type: "info"
          })
        );
      }

      const { notifications } = store.getState().notification;
      expect(notifications).toHaveLength(3);
    });

    it("should dismiss notifications", () => {
      store.dispatch(
        addNotification({
          id: "n-1",
          manager: "mgr-1",
          message: "Test",
          type: "info"
        })
      );

      store.dispatch(dismissNotification("n-1"));
      expect(store.getState().notification.notifications).toHaveLength(0);
    });
  });

  describe("ui slice", () => {
    it("should toggle and close menu", () => {
      store.dispatch(toggleMenu());
      expect(store.getState().ui.menu).toBe(true);

      store.dispatch(toggleMenu());
      expect(store.getState().ui.menu).toBe(false);

      store.dispatch(toggleMenu());
      store.dispatch(closeMenu());
      expect(store.getState().ui.menu).toBe(false);
    });
  });

  describe("news slice", () => {
    it("should add news and clear on next turn", () => {
      store.dispatch(addNews("Breaking: Pier Paolo Pasolini wins award"));
      expect(store.getState().news.news).toHaveLength(1);

      store.dispatch(nextTurn());
      expect(store.getState().news.news).toHaveLength(0);
    });
  });

  describe("gameLoadState: full state replacement", () => {
    it("should replace game, manager, event, news, prank, betting, stats, invitation slices", () => {
      // First modify some state
      store.dispatch(nextTurn());
      store.dispatch(nextTurn());
      store.dispatch(nextTurn());
      expect(store.getState().game.turn.round).toBe(3);

      // Create a "saved" state with round 10
      const savedState = JSON.parse(JSON.stringify(store.getState()));
      savedState.game.turn.round = 10;
      savedState.game.turn.season = 2;

      // Load it
      store.dispatch(gameLoadState(savedState));

      // Game state should be replaced
      expect(store.getState().game.turn.round).toBe(10);
      expect(store.getState().game.turn.season).toBe(2);
    });
  });
});
