import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { saveGame, loadGame } from "@/services/persistence";
import { createTestStore } from "./helpers/createTestStore";
import { managerAdd, managerSetActive } from "@/ducks/manager";
import { nextTurn, setGamePhase, teamIncrementStrength } from "@/ducks/game";

// Provide a localStorage stub for Node.js environment
let storageData: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => storageData[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storageData[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete storageData[key];
  }),
  clear: vi.fn(() => {
    storageData = {};
  }),
  get length() {
    return Object.keys(storageData).length;
  },
  key: vi.fn((index: number) => Object.keys(storageData)[index] ?? null)
};

beforeEach(() => {
  storageData = {};
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  (globalThis as any).localStorage = localStorageMock;
});

afterEach(() => {
  delete (globalThis as any).localStorage;
});

describe("persistence service", () => {
  describe("saveGame", () => {
    it("serializes state to localStorage under 'mhm97' key", () => {
      const store = createTestStore();
      const state = store.getState();

      saveGame(state);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "mhm97",
        expect.any(String)
      );

      // Verify it's valid JSON
      const saved = localStorageMock.setItem.mock.calls[0][1];
      expect(() => JSON.parse(saved)).not.toThrow();
    });

    it("saves modified state correctly", () => {
      const store = createTestStore();

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
            flags: {}
          }
        })
      );
      store.dispatch(managerSetActive("pasolini"));
      store.dispatch(nextTurn());
      store.dispatch(setGamePhase("action"));
      store.dispatch(teamIncrementStrength({ team: 5, amount: 12 }));

      const state = store.getState();
      saveGame(state);

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.manager.active).toBe("pasolini");
      expect(saved.game.turn.round).toBe(1);
      expect(saved.game.turn.phase).toBe("action");
    });
  });

  describe("loadGame", () => {
    it("returns null when no saved game exists", () => {
      const result = loadGame();
      expect(result).toBeNull();
    });

    it("deserializes state from localStorage", () => {
      const store = createTestStore();
      const state = store.getState();

      // Save first
      saveGame(state);

      // Load
      const loaded = loadGame();
      expect(loaded).not.toBeNull();
      expect(loaded!.game.turn).toEqual(state.game.turn);
      expect(loaded!.manager).toEqual(state.manager);
    });

    it("round-trips modified state correctly", () => {
      const store = createTestStore();

      store.dispatch(
        managerAdd({
          manager: {
            id: "pasolini",
            name: "Pier Paolo Pasolini",
            difficulty: 2,
            pranksExecuted: 0,
            services: {
              coach: false,
              insurance: false,
              microphone: false,
              cheer: false
            },
            balance: 99999,
            arena: { name: "Salò Arena", level: 1 },
            extra: 1000,
            insuranceExtra: 0,
            flags: { rally: true }
          }
        })
      );
      store.dispatch(managerSetActive("pasolini"));
      store.dispatch(nextTurn());
      store.dispatch(nextTurn());
      store.dispatch(nextTurn());

      const state = store.getState();
      saveGame(state);

      const loaded = loadGame();
      expect(loaded).not.toBeNull();
      expect(loaded!.game.turn.round).toBe(3);
      expect(loaded!.manager.active).toBe("pasolini");
      expect(loaded!.manager.managers["pasolini"].balance).toBe(99999);
      expect(loaded!.manager.managers["pasolini"].arena.name).toBe(
        "Salò Arena"
      );
      expect(loaded!.manager.managers["pasolini"].flags.rally).toBe(true);
    });
  });
});
