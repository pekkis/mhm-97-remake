# XState Migration Plan: Redux + Saga → XState 5 Hierarchical Actor Model

## Decisions Locked

| #   | Question                          | Decision                                                                                                                                 |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Regression tests first?           | Yes — vitest regression harness with deterministic seed before touching sagas                                                            |
| Q2  | 96 event files?                   | Clean break — convert from saga generators to pure command-returning functions                                                           |
| Q3  | `src/data/` cleanup?              | Move logic out — `data/` should be pure data. Selectors, awards saga logic, tournament saga logic relocate                               |
| Q4  | Save/load backwards compat?       | Clean break — no migration layer, localStorage format changes freely                                                                     |
| Q5  | Multiple actors vs monolith?      | Hierarchical actor composition — multiple actor instances, spawned by parent                                                             |
| Q6  | `@xstate/store` for simple ducks? | Yes for trivial ducks — `ui`, `country`, `notification` use `@xstate/store`; anything with cross-cutting logic stays in a proper machine |
| Q7  | PR strategy?                      | Small incremental PRs to `xstate` branch, one concern each                                                                               |
| Q8  | Branch strategy?                  | `xstate` base branch off `master`. Feature branches → PR to `xstate`. Final merge `xstate` → `master` when complete                      |

---

## Architecture: Hierarchical Actor Model

```
appMachine (root)
├── state: menu
│   └── handles: startGame, loadGame, settings
│
└── state: inGame
    └── spawns: gameMachine (owns all game state in context)
        │
        ├── spawns: phaseMachine (per-round, sequences phases from calendar)
        │   ├── state: action → spawns actionPhaseMachine
        │   │   └── listens: buyPlayer, sellPlayer, toggleService, crisisMeeting, etc.
        │   ├── state: prank
        │   ├── state: gameday → spawns gamedayMachine (multi-advance)
        │   ├── state: calculations (automatic, no player input)
        │   ├── state: eventCreation (automatic)
        │   ├── state: event → spawns eventPhaseMachine (polls unresolved)
        │   ├── state: news (automatic)
        │   ├── state: seed (automatic)
        │   ├── state: startOfSeason → compound (strategy → betting)
        │   ├── state: endOfSeason → compound (worlds → awards → promo/rel)
        │   ├── state: gala
        │   ├── state: invitationsCreate
        │   └── state: invitationsProcess
        │
        ├── spawns: eventActors[] (one per active event, owns event lifecycle)
        │   └── states: created → (waitingForResolution | autoResolved) → resolved → processed
        │
        └── context: GameContext (= current Redux store shape)
            ├── turn: { season, round, phase }
            ├── teams: Team[]
            ├── competitions: Record<string, Competition>
            ├── managers: ManagerDefinition[]
            ├── flags: GameFlags
            ├── manager: ManagerState
            ├── betting: BettingState
            ├── news: NewsState
            ├── events: EventState
            ├── pranks: PrankInstance[]
            ├── invitations: InvitationState
            ├── stats: StatsState
            ├── notifications: NotificationState
            ├── country: CountryState
            └── serviceBasePrices: Record<string, number>
```

### Key boundaries

- `gameMachine.context` is the single source of truth (replaces Redux store)
- Phase machines are invoked actors (spawned on entry, stopped on exit)
- Event actors are spawned actors (created during eventCreation phase, live until processed)
- Components read state via `useSelector(gameMachine)` or `useActorRef` from `@xstate/react`
- Selectors become pure functions: `(context: GameContext) => T` (same signatures, new source)

---

## `@xstate/store` for Simple Ducks

Three ducks are pure key-value stores with no cross-cutting concerns:

| Duck           | Current Shape                          | XState Store Events                      |
| -------------- | -------------------------------------- | ---------------------------------------- |
| `ui`           | `{ menu: boolean }`                    | `toggleMenu`, `closeMenu`                |
| `country`      | `Record<string, { strength: number }>` | `alterStrength`, `setStrength`           |
| `notification` | `{ notifications: Notification[] }`    | `addNotification`, `dismissNotification` |

These become `createStore()` instances — simpler than full machines, React-integrated via `useStore()`. They live as standalone stores, not inside the game machine, because they're UI-layer concerns (notifications/menu) or reference data (country strengths). The game machine can send them events when needed.

Everything else (manager, betting, stats, events, pranks, invitations, news, game, meta) has cross-cutting logic and belongs in `gameMachine.context` with actions/guards.

---

## Event System Redesign (96 files)

**Current:** Each event file exports `{ create, render, options, resolve, process }` where `create`, `resolve`, `process` are saga generators using `yield* select/call/put`.

**Target:** Pure command-returning functions. The machine interprets commands.

```ts
// NEW event interface
type EventCommand =
  | { type: "incrementBalance"; managerId: string; amount: number }
  | { type: "decrementBalance"; managerId: string; amount: number }
  | { type: "addEffect"; teamId: number; effect: TeamEffect }
  | { type: "setMorale"; teamId: number; morale: number };
// ... all ~15 mutation types as discriminated union

type MHMEvent<TData, CData> = {
  type: "manager";
  create: (
    data: CData,
    ctx: GameContext
  ) => { eventData: TData; commands: EventCommand[] };
  render: (data: TData) => string[];
  options?: (data: TData) => Record<string, string>;
  resolve?: (
    data: TData,
    value: string,
    ctx: GameContext
  ) => { resolved: TData; commands: EventCommand[] };
  process?: (data: TData, ctx: GameContext) => EventCommand[];
};
```

**Key change:** Events receive `GameContext` (read-only snapshot) instead of calling `yield* select()`. They return command objects instead of calling `yield* put/call`. The machine applies commands to context via `assign()`.

This eliminates all saga imports from event files. ~96 files touched but the transform is mechanical:

- `yield* select(selector)` → function receives `ctx` parameter, call `selector(ctx)` directly
- `yield* call(addEvent, data)` → return `{ eventData: data, commands: [] }`
- `yield* put(action(payload))` → return `{ commands: [{ type: "action", payload }] }`
- `produce()` stays (immer is still used inside `assign()`)

### Event complexity clusters

| Cluster               | Count | Characteristics                           |
| --------------------- | ----- | ----------------------------------------- |
| Balance-only          | ~30   | Just `incrementBalance` (simplest)        |
| Balance + morale      | ~20   | Two commands                              |
| Balance + strength    | ~15   | Two commands                              |
| Context-reading       | ~10   | Need `select()` reads → receive `ctx`     |
| Interactive (options) | ~10   | User choice via `options()` + `resolve()` |
| Complex               | ~11   | Protest, job offers, attitude changes     |

Convert cluster by cluster, smallest first.

---

## Migration Phases (PR sequence to `xstate` branch)

### Phase 0: Foundation (PRs 1–3)

**PR 1: Regression test harness** ✅ COMPLETE

- 81 new tests across 5 test suites (105 total with existing 24)
- `calendar.test.ts` (22), `store-initialization.test.ts` (20), `reducers.test.ts` (24), `game-simulation.test.ts` (12), `save-load.test.ts` (3)
- Key discovery: calendar has **75 rounds** (0–74), not 54
- Infrastructure: `createTestStore()` helper for saga-free reducer testing

**PR 2: `src/data/` cleanup** ✅ COMPLETE

- `data/selectors.ts` → `src/selectors.ts` (all Redux selectors, not data)
- `data/awards.ts` → `src/sagas/awards.ts` (saga generator logic)
- `data/tournaments.ts` saga logic → `src/sagas/tournament-eligibility.ts` (split data from generators)
- `data/competition-sagas.ts` → `src/sagas/competition-registry.ts`
- `data/events/` + `data/events.ts` + `data/pranks.ts` → `src/game/` (game definitions with saga generators)
- All `../` relative imports normalized to `@/` alias paths (709 sites across 189 files)
- `src/data/` now contains only pure data — zero `typed-redux-saga` imports

**PR 3: XState base branch setup + type foundations** ✅ COMPLETE

- Created `src/machines/types.ts` — `GameContext` type (flat union of all 12 Redux duck state shapes; `meta` excluded for `appMachine`, `ui` excluded for `@xstate/store`)
- Created `src/machines/commands.ts` — `EventCommand` discriminated union (25 variants covering all mutations event files perform via saga helpers)
- Created `src/machines/selectors.ts` — all selectors from `src/selectors.ts` mirrored as `ContextSelector<T>` reading from `GameContext` instead of `RootState`
- **Bug found and fixed:** `totalGamesPlayed` selector was returning `undefined` when stats existed and `0` when missing (inverted logic). Fixed in both Redux selectors and XState selectors to correctly sum `record.win + record.draw + record.loss`.
- `remeda` functions (`entries`, `values`, `keys`) adopted codebase-wide (~30 files) for better TypeScript key type preservation
- Build verified, 105 tests pass, zero TypeScript errors

### Phase 1: Simple stores + app shell (PRs 4–6)

**PR 4: `@xstate/store` for ui, country, notification**

- Create `src/stores/ui.ts`, `src/stores/country.ts`, `src/stores/notification.ts`
- Wire into React via `useStore()` from `@xstate/store`
- Components switch from `useAppSelector` to `useStore()`
- Keep Redux ducks alive temporarily (dual-write during transition)

**PR 5: `appMachine` — menu ↔ game lifecycle**

- Create `src/machines/app.ts` — states: `menu`, `starting`, `loading`, `inGame`
- Replaces `src/sagas/meta.ts` (main menu loop, start/load orchestration)
- `startGame` → transition to `starting` → invoke game setup → `inGame`
- `loadGame` → transition to `loading` → parse localStorage → `inGame`
- `quitToMainMenu` → transition back to `menu`, stop game actor
- Wire into `Root.tsx` via `useMachine(appMachine)`

**PR 6: Save/load as machine actions**

- `saveGame` → action in `gameMachine` that serializes context to localStorage
- `loadGame` → `appMachine` reads localStorage, passes as initial context to `gameMachine`
- Clean break: new localStorage key (e.g. `"mhm97-v2"`) or same key with incompatible format
- Delete `src/sagas/meta.ts`

### Phase 2: Game machine core (PRs 7–10)

**PR 7: `gameMachine` skeleton + turn/round context**

- Create `src/machines/game.ts` — the central game machine
- Context: full `GameContext` (all 12 duck states merged)
- States: `idle` → `roundStart` → `executingPhases` → `roundEnd` → (loop)
- Calendar lookup in `roundStart` entry action
- Phase list stored in context, consumed sequentially

**PR 8: Automatic phases (calculations, news, seed, eventCreation)**

- No player interaction — pure state transforms
- Implement as `assign()` actions or invoked promises
- `calculations` → `assign()` that decrements durations, updates readiness, deducts service costs
- `seed` → `assign()` that runs competition seeding
- `news` → `assign()` that displays announcements (no-op state-wise)
- `eventCreation` → `assign()` + spawns event actors

**PR 9: Interactive phases — action, gameday, event**

- `actionPhase` → compound state with parallel regions:
  - Region: `waitingForAdvance` (terminal on `ADVANCE` event)
  - Handles: `BUY_PLAYER`, `SELL_PLAYER`, `TOGGLE_SERVICE`, `CRISIS_MEETING`, `IMPROVE_ARENA`, `ORDER_PRANK`, `ACCEPT_INVITATION`, `PLACE_BET`, `SAVE_GAME`
- `gamedayPhase` → states: `waitForStart` → `playing` → `waitForResults` → `done`
- `eventPhase` → states: `autoResolving` → `waitingForResolution` → `processing` → `done`
  - Guards: `allEventsResolved` enables transition to `processing`

**PR 10: Season boundary phases**

- `startOfSeason` → compound: `setup` → `selectStrategy` → `championshipBetting` → `done`
- `endOfSeason` → compound: `worldChampionships` → `awards` → `promotionRelegation` → `stories` → `done`
- `gala` → simple transitional state
- `invitationsCreate` / `invitationsProcess` → `assign()` actions

### Phase 3: Event system migration (PRs 11–13)

**PR 11: Event command infrastructure**

- Create `src/machines/eventInterpreter.ts` — applies `EventCommand[]` to `GameContext`
- Create adapter: wraps old saga-based events to return commands (temporary bridge)
- Test: verify command application matches saga side effects

**PR 12: Convert event files batch 1 (50 simple events)**

- Events with `autoResolve: true` and no `options`/`resolve` methods
- Mechanical transform: `yield* select(x)` → `x(ctx)`, `yield* call(y)` → command
- ~50 files, each a small self-contained change

**PR 13: Convert event files batch 2 (46 complex events)**

- Events with `options`, `resolve`, multi-step processing
- Include: `joboffer-phl`, `haanpera-marries`, etc.
- Remove all saga imports from event files
- Delete adapter from PR 11

### Phase 4: Remaining sagas → machine actions (PRs 14–18)

**PR 14: Betting system → `gameMachine` actions**

- `src/sagas/betting.ts` → `gameMachine` event handlers
- Championship betting → `startOfSeason` compound state

**PR 15: Manager actions → `gameMachine` actions**

- `src/sagas/manager.ts` → `gameMachine` event handlers
- Buy/sell player, toggle service, improve arena, crisis meeting

**PR 16: Stats + awards → `gameMachine` actions**

- `src/sagas/stats.ts` + `awards.ts` → `endOfSeason` state actions
- Streak tracking, season stat recording

**PR 17: Prank + invitation systems**

- `src/sagas/prank.ts` → prank phase handler in `gameMachine`
- `src/sagas/invitation.ts` → invitation phase handlers
- Existing `prankSelection.ts` XState machine stays (it's already correct)

**PR 18: Game simulation (gameday saga)**

- `src/sagas/gameday.ts` → invoked actor or promise in gameday phase
- Competition match simulation, result recording
- This is the most complex saga — do last

### Phase 5: Cleanup (PRs 19–21)

**PR 19: Delete Redux infrastructure**

- Remove `src/store.ts`, `src/getSagas.ts`, `src/config/redux.ts`
- Remove `src/ducks/` directory (all 13 files)
- Remove `src/sagas/` directory (all 25 files)
- Update `src/Root.tsx` — no more `<Provider store={store}>`
- Wire `appMachine` as top-level provider via `@xstate/react`

**PR 20: Remove Redux + saga packages**

- `pnpm remove @reduxjs/toolkit react-redux redux redux-saga typed-redux-saga immer`
- (immer stays if XState `assign()` uses it — check XState 5 internals)
- Update `package.json`, verify clean build

**PR 21: Final cleanup + documentation**

- Update `AGENTS.md` with new architecture
- Update `README.md`
- Remove any dead code, unused types
- Final regression test run with deterministic seed
- Merge `xstate` → `master`

---

## Risk Assessment

| Risk                                        | Severity    | Mitigation                                                                                                                              |
| ------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Phase sequencing breaks                     | 🔴 Critical | Regression tests (PR 1) catch ordering issues. Calendar-driven tests verify exact phase sequence per round.                             |
| Event conversion introduces bugs            | 🟡 High     | Mechanical transform + command interpreter tests. Each event file gets a before/after comparison.                                       |
| Save/load format change                     | 🟡 High     | Clean break decided. New format is just `JSON.stringify(gameMachine.context)`.                                                          |
| Performance (96 event files importing ctx)  | 🟢 Low      | Events receive context snapshot, not subscription. No re-render cost. XState 5 batches context updates.                                 |
| Circular dependencies in machine            | 🟢 Low      | `gameMachine` is single file with `setup()`. Event files import types only, not the machine.                                            |
| Component migration volume (~38 components) | 🟡 Medium   | Components only change import path (`useAppSelector` → `useSelector` from `@xstate/react`). Selector function signatures are identical. |
| Long-lived branch merge conflicts           | 🟡 High     | Small PRs, merge frequently, avoid parallel work on same files.                                                                         |

---

## Size Estimate

| Phase                              | Files Touched         | Estimated PRs  | Complexity  |
| ---------------------------------- | --------------------- | -------------- | ----------- |
| Phase 0: Foundation                | ~5                    | 3 ✅           | Medium      |
| Phase 1: Simple stores + app shell | ~20                   | 3              | Low         |
| Phase 2: Game machine core         | ~30                   | 4–6            | Very High   |
| Phase 3: Event system              | ~100                  | 3              | High (bulk) |
| Phase 4: Remaining sagas           | ~25                   | 5              | High        |
| Phase 5: Cleanup                   | ~40                   | 3              | Low         |
| **Total**                          | **~150 unique files** | **~21–23 PRs** |             |
