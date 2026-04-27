import { describe, it, expect } from "vitest";
import { createTestStore } from "./helpers/createTestStore";
import { keys } from "remeda";

describe("store initialization", () => {
  it("should create a store with all 11 reducer slices", () => {
    const store = createTestStore();
    const state = store.getState();

    expect(state).toHaveProperty("game");
    expect(state).toHaveProperty("manager");
    expect(state).toHaveProperty("event");
    expect(state).toHaveProperty("meta");
    expect(state).toHaveProperty("news");
    expect(state).toHaveProperty("ui");
    expect(state).toHaveProperty("notification");
    expect(state).toHaveProperty("prank");
    expect(state).toHaveProperty("stats");
    expect(state).toHaveProperty("invitation");
    expect(state).toHaveProperty("country");
  });

  describe("game slice initial state", () => {
    it("should start at season 0, round 0, phase undefined", () => {
      const store = createTestStore();
      const { turn } = store.getState().game;

      expect(turn.season).toBe(0);
      expect(turn.round).toBe(0);
      expect(turn.phase).toBeUndefined();
    });

    it("should have teams array with correct length", () => {
      const store = createTestStore();
      const { teams } = store.getState().game;

      // Should have teams (at least 13 domestic + European)
      expect(teams.length).toBeGreaterThan(12);
    });

    it("should have domestic teams with expected properties", () => {
      const store = createTestStore();
      const { teams } = store.getState().game;

      const domesticTeams = teams.filter((t) => t.domestic);
      expect(domesticTeams.length).toBeGreaterThanOrEqual(12);

      for (const team of domesticTeams) {
        expect(team).toHaveProperty("id");
        expect(team).toHaveProperty("name");
        expect(team).toHaveProperty("strength");
        expect(team).toHaveProperty("morale", 0);
        expect(team).toHaveProperty("strategy", 2);
        expect(team).toHaveProperty("readiness", 0);
        expect(team).toHaveProperty("effects");
        expect(team).toHaveProperty("opponentEffects");
        expect(team.effects).toEqual([]);
        expect(team.opponentEffects).toEqual([]);
      }
    });

    it("should have default flags", () => {
      const store = createTestStore();
      const { flags } = store.getState().game;

      expect(flags.jarko).toBe(false);
      expect(flags.usa).toBe(false);
      expect(flags.canada).toBe(false);
      expect(flags.haanperaMarried).toBe(false);
      expect(flags.mauto).toBe(false);
      expect(flags.psycho).toBeUndefined();
    });

    it("should have default service base prices", () => {
      const store = createTestStore();
      const { serviceBasePrices } = store.getState().game;

      expect(serviceBasePrices.insurance).toBe(1000);
      expect(serviceBasePrices.coach).toBe(3200);
      expect(serviceBasePrices.microphone).toBe(500);
      expect(serviceBasePrices.cheer).toBe(3000);
    });

    it("should have competitions", () => {
      const store = createTestStore();
      const { competitions } = store.getState().game;

      expect(competitions).toHaveProperty("phl");
      expect(competitions).toHaveProperty("division");
      expect(competitions).toHaveProperty("ehl");
    });

    it("should have NPC manager definitions", () => {
      const store = createTestStore();
      const { managers } = store.getState().game;

      expect(managers.length).toBeGreaterThanOrEqual(12);
      expect(managers[0]).toHaveProperty("id");
      expect(managers[0]).toHaveProperty("name");
    });
  });

  describe("meta slice initial state", () => {
    it("should not be started, loading, saving, or starting", () => {
      const store = createTestStore();
      const meta = store.getState().meta;

      expect(meta.started).toBe(false);
      expect(meta.loading).toBe(false);
      expect(meta.saving).toBe(false);
      expect(meta.starting).toBe(false);
    });

    it("should have default manager template", () => {
      const store = createTestStore();
      const { manager } = store.getState().meta;

      expect(manager.name).toBe("Gaylord Lohiposki");
      expect(manager.arena).toBe("MasoSports Areena");
      expect(manager.difficulty).toBe("2");
      expect(manager.team).toBe(12);
    });
  });

  describe("manager slice initial state", () => {
    it("should have no active manager and empty managers", () => {
      const store = createTestStore();
      const { active, managers } = store.getState().manager;

      expect(active).toBeUndefined();
      expect(managers).toEqual({});
    });
  });

  describe("event slice initial state", () => {
    it("should have empty events", () => {
      const store = createTestStore();
      expect(store.getState().event.events).toEqual({});
    });
  });

  describe("news slice initial state", () => {
    it("should have empty news and announcements", () => {
      const store = createTestStore();
      const news = store.getState().news;

      expect(news.news).toEqual([]);
      expect(news.announcements).toEqual({});
    });
  });

  describe("ui slice initial state", () => {
    it("should have menu closed", () => {
      const store = createTestStore();
      expect(store.getState().ui.menu).toBe(false);
    });
  });

  describe("notification slice initial state", () => {
    it("should have empty notifications", () => {
      const store = createTestStore();
      expect(store.getState().notification.notifications).toEqual([]);
    });
  });

  describe("prank slice initial state", () => {
    it("should have empty pranks", () => {
      const store = createTestStore();
      expect(store.getState().prank.pranks).toEqual([]);
    });
  });

  describe("stats slice initial state", () => {
    it("should have empty stats structures", () => {
      const store = createTestStore();
      const stats = store.getState().stats;

      expect(stats.managers).toEqual({});
      expect(stats.currentSeason).toBeUndefined();
      expect(stats.seasons).toEqual([]);
    });
  });

  describe("invitation slice initial state", () => {
    it("should have empty invitations", () => {
      const store = createTestStore();
      expect(store.getState().invitation.invitations).toEqual([]);
    });
  });

  describe("country slice initial state", () => {
    it("should have countries with strength values", () => {
      const store = createTestStore();
      const { countries } = store.getState().country;

      // Should have multiple countries
      const countryIds = keys(countries);
      expect(countryIds.length).toBeGreaterThan(0);

      // Each country should have iso, name, and strength
      for (const id of countryIds) {
        const country = countries[id];
        expect(country).toHaveProperty("iso");
        expect(country).toHaveProperty("name");
      }
    });
  });
});
