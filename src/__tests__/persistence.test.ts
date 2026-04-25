import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { saveGame, loadGame } from "@/services/persistence";
import { createDefaultGameContext, type Manager } from "@/state";

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

const pasolini: Manager = {
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
};

describe("persistence service", () => {
  describe("saveGame", () => {
    it("serializes context to localStorage under 'mhm97' key", () => {
      saveGame(createDefaultGameContext());

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "mhm97",
        expect.any(String)
      );

      const saved = localStorageMock.setItem.mock.calls[0][1];
      expect(() => JSON.parse(saved)).not.toThrow();
    });

    it("saves modified context correctly", () => {
      const ctx = createDefaultGameContext();
      ctx.manager.active = pasolini.id;
      ctx.manager.managers[pasolini.id] = pasolini;
      ctx.turn.round = 5;
      ctx.turn.phase = "action";

      saveGame(ctx);

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.manager.active).toBe("pasolini");
      expect(saved.turn.round).toBe(5);
      expect(saved.turn.phase).toBe("action");
    });
  });

  describe("loadGame", () => {
    it("returns null when nothing is saved", () => {
      expect(loadGame()).toBeNull();
    });

    it("round-trips a context correctly", () => {
      const ctx = createDefaultGameContext();
      ctx.manager.active = pasolini.id;
      ctx.manager.managers[pasolini.id] = pasolini;
      ctx.turn.round = 3;

      saveGame(ctx);

      const loaded = loadGame();
      expect(loaded).not.toBeNull();
      expect(loaded!.turn.round).toBe(3);
      expect(loaded!.manager.active).toBe("pasolini");
      expect(loaded!.manager.managers["pasolini"].balance).toBe(150000);
      expect(loaded!.manager.managers["pasolini"].arena.name).toBe(
        "Cinema Paradiso"
      );
      expect(loaded!.manager.managers["pasolini"].flags.rally).toBe(true);
    });
  });
});
