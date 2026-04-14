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
            ├── event: EventState
            ├── prank: PrankState
            ├── invitation: InvitationState
            ├── stats: StatsState
            ├── notification: NotificationState
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

**PR 4: `@xstate/store` for ui, country, notification** ✅ COMPLETE

- Created `src/stores/ui.ts`, `src/stores/country.ts`, `src/stores/notification.ts` with `@xstate/store`
- Sync middleware (`src/stores/sync.ts`) dual-writes Redux actions → XState stores using RTK `.match()` type guards
- Components read from XState stores via `useSelector` from `@xstate/store-react`
- Stately Inspector (`src/stores/inspector.ts`) added for dev-only visualization (tree-shaken in prod)
- Redux ducks remain alive (dual-write during transition)

**PR 5: `appMachine` — menu ↔ game lifecycle** ✅ COMPLETE

- Created `src/machines/app.ts` — pure machine definition (no side effects, no actor creation)
  - States: `menu` → `starting`/`loading` → `inGame`
  - Events: `START_GAME`, `LOAD_GAME`, `GAME_STARTED`, `GAME_LOADED`, `QUIT`
  - Exported: `appMachine` definition + `AppMachineEvents` type
- Created `src/machines/actors.ts` — centralized actor instantiation point
  - Pattern: machine files export pure definitions, `actors.ts` creates and starts singleton actors
  - Future machines will have their actors created here too
- Extended `src/stores/sync.ts` — bridges Redux meta actions → machine events
  - `startGame` → `START_GAME`, `loadGame` → `LOAD_GAME`, `gameLoaded` → `GAME_LOADED`
  - `seasonStart` → `GAME_STARTED` (fires every season, not just first — machine silently ignores in `inGame`)
  - `quitToMainMenu` → `QUIT`
- `App.tsx` reads `state.matches("inGame")` via `useSelector(appActor, ...)` from `@xstate/react`
- `StartMenu.tsx` reads `state.matches("starting")` via `useSelector(appActor, ...)`
- `inspector.ts` registers `appActor` via `appActor.system.inspect(inspect)` (machine actors use system, not direct)
- 16 unit tests in `src/__tests__/app-machine.test.ts`
- **Key learning:** `useMachine(machine)` creates+owns actor per component lifecycle. `useSelector(actor, selector)` subscribes to an external actor. `appActor` uses the `useSelector` pattern since it's a global singleton.

**PR 6: `gameMachine` skeleton + persistence extraction** ✅ COMPLETE

- Created `src/machines/game.ts` — pure machine definition
  - `GameMachineContext` extends `GameContext` with `currentRoundCalendar`, `remainingPhases`, `currentPhase`
  - States: `idle` → `playing` (compound: `roundStart` → `executingPhases` → `roundEnd` loop) → `done`
  - `done` only reachable via `QUIT` (player quits to menu) — NOT via season boundary
  - Calendar lookup + phase list population on `roundStart` entry
  - `PHASE_COMPLETE` drives phase-by-phase progression in `executingPhases`
- Created `src/services/persistence.ts` — extracted `saveGame`/`loadGame` from meta saga
- Extended `src/machines/actors.ts` — `startGameActor`/`stopGameActor`/`getGameActor` lifecycle management
- Extended `src/stores/sync.ts` — starts game actor on `SEASON_START` or `GAME_LOADED`, stops on `QUIT`
  - `deriveGameContext(state: RootState)` bridges Redux → gameMachine initial context
- Dev-only context diff logger via `microdiff` (devDep) — subscribes to game actor, logs state transitions with color-coded diffs
- Stately Inspector registration skipped for gameMachine (large context causes `@statelyai/inspect` crash)
- 21 game machine tests + 5 persistence tests (239 total)
- **Key finding:** The game loops forever — `endOfSeason` phase resets `turn.round` to 0. Season boundary is NOT a terminal condition. Original `seasonOver` guard was incorrect and removed.
- **Key finding:** PR 7 as originally planned (implement automatic phase logic) is premature. Machine is passive observer; context goes stale. Revised PR 7 scope below.

### Phase 2: Game machine core (PRs 7–14)

**PR 7: Phase tracking bridge** ✅ COMPLETE

- **Original plan:** Implement automatic phase logic (calculations, news, seed, eventCreation) as `assign()` actions in the gameMachine.
- **Problem:** The gameMachine is a passive observer. Its context is derived from Redux on startup and never updated. Running phase logic in both the machine AND the saga would corrupt state (double decrements, double seedings, etc.).
- **Revised scope:** Bridge `PHASE_COMPLETE` events from sagas to the gameMachine so it tracks which phase is active, without executing any phase logic.
  - Added `sagaPhaseComplete` Redux action — dispatched after each saga phase function completes
  - Intercept `setGamePhase` in sync middleware → send `SYNC_REDUX_PHASE` to game actor (tracks Redux sub-phase names for dev observability)
  - Intercept `sagaPhaseComplete` in sync middleware → send `PHASE_COMPLETE` to game actor (drives the machine's round lifecycle)
  - Added `reduxPhase` context field to `GameMachineContext` — separate from `currentPhase` (calendar-derived); tracks Redux-reported phase names including sub-phases (e.g. "select-strategy" within "startOfSeason")
  - The dev logger (from PR 6) now shows the machine walking through all phases per round, validating the round lifecycle against real saga execution
  - No state mutation in the machine — purely observational
  - 16 tests in `phase-tracking-bridge.test.ts` including full 75-round season walkthrough and 3-season multi-season test (255 total)
- **Key finding: infinite `always` loop at season boundary** — When the machine walked past calendar[74] into round 75, `roundStart → (empty phases) → roundEnd → roundStart` looped infinitely via synchronous `always` transitions, causing browser hang and test OOM. Fix: `calendarOutOfBounds` guard + `waitingForNewSeason` parking state. The sync middleware restarts the actor at round 0 on each `seasonStart`.
- **Key finding: `SEASON_END` sets `turn.round = -1`** — Redux reducer sets round to -1, `SEASON_START` doesn't reset it. The saga's `nextTurn()` bumps it to 0. The `calendarOutOfBounds` guard catches both negative and out-of-range rounds.
- **Dev logger upgraded** — dot-path state formatting (`playing.executingPhases`), color-coded diffs with prev/next context, `xstate.init` and zero-diff transitions suppressed.
- **Real phase migration** happens later, per-phase: remove saga phase, implement in machine, verify. This is safer and more incremental.

**PR 8: Bidirectional context sync bridge** ✅ COMPLETE

- **Purpose:** Enable incremental phase migration by keeping Redux and XState in sync between phases. Without this, the machine's context goes stale and migrated phases would operate on outdated data.
- **Redux → XState (before machine phase):** On each `sagaPhaseComplete`, sync middleware sends `SYNC_CONTEXT` to the game actor with a fresh `deriveGameContext(store.getState())`. XState's `assign()` shallow merge replaces `GameContext` fields while preserving machine-internal fields (`currentRoundCalendar`, `remainingPhases`, `currentPhase`, `reduxPhase`).
- **XState → Redux (after machine phase):** `syncFromMachine(context: GameContext)` action. Each of 10 ducks grabs its slice — same shape as game load but separate action to avoid triggering load-specific saga side effects. Game duck handler explicitly picks its 7 fields (typed — `tsc` catches missing fields if `GameState` grows).
- **Ordering invariant:** In sync middleware, `SYNC_CONTEXT` is sent before `PHASE_COMPLETE` so the machine's context is fresh when it transitions to the next phase.
- **GameContext shape harmonized:** `pranks: PrankInstance[]` → `prank: PrankState`, `country: Record<string, Country>` → `country: CountryState`. All `GameContext` fields now mirror the exact Redux duck state shapes — `deriveGameContext` and duck `syncFromMachine` handlers are straight pass-throughs (no wrapping/unwrapping). Exported `PrankState` and `CountryState` from their ducks.
- **`deriveGameContext` exported** for test use.
- **Temporary scaffolding:** Both sync directions get deleted when Redux dies.
- 23 new tests in `bidirectional-sync.test.ts` (672 lines) — context round-trip, ordering invariant, all duck slices, `deriveGameContext` mapping. 278 total tests.
- 13 files changed, 759 additions, 10 deletions.

**PR 9: First phase migration — `calculations`** ✅ COMPLETE

- First real phase migrated from saga to `assign()` action in the gameMachine
- `src/machines/calculations.ts` — pure function `executeCalculationsPhase(ctx: GameContext): Partial<GameContext>` using immer `produce()` for safe nested mutations
- `executeMachinePhase` assign action in gameMachine — conditionally calls phase function when `currentPhase === "calculations"`; runs on `executingPhases` entry alongside `advanceToNextPhase`
- Saga side reduced to signal-only: `src/sagas/game.ts` dispatches `sagaPhaseComplete({ phase: "calculations" })` without executing any phase logic
- `MACHINE_OWNED_PHASES` set in `src/stores/sync.ts` — determines sync direction per phase. Machine-owned phases push machine → Redux (`syncFromMachine`), saga-owned push Redux → machine (`SYNC_CONTEXT`)
- `src/sagas/phase/calculations.ts` deleted (dead code — saga no longer calls it)
- **Conventions established:**
  - **immer `produce()` for phase functions:** No nested spreading. Use `produce()` for safe nested mutations — half the lines, no risk of missing a spread level.
  - **Explicit field picking over rest-destructuring:** `extractGameContext` uses explicit listing (16 fields) instead of rest-destructuring with `_`-prefixed exclusions. Type-safe: `tsc` catches missing fields.
  - **`MACHINE_OWNED_PHASES` set:** Updated as phases migrate. Determines reverse sync direction in `sagaPhaseComplete` handler.
  - **Sub-phases are not calendar phases:** `"results"`, `"select-strategy"`, etc. are UI states within a calendar phase, tracked via `reduxPhase` context field. NOT entries in the calendar's `phases` array.
- 21 new tests (`calculations-phase.test.ts`), 299 total across 21 test files

**PR 10: Interactive phase pattern — `news` (wait-for-user)** ✅ COMPLETE

- **Original plan:** Migrate `news`, `seed`, `eventCreation` as automatic phases using the PR 9 `assign()` pattern. **This was wrong** — `news` blocks on user input (`take(advance)`), `seed` fan-outs through competition saga generators, and `eventCreation` depends on the global RNG + 96 event `create` saga generators. None of them are pure deterministic transforms.
- **New migration pattern: wait-for-user.** The machine gates progression by waiting for an `ADVANCE` event from the user. The saga blocks via `waitFor(actor)` instead of `take(advance)`. No state mutation — the machine is a flow controller.
- **Three migration patterns now established:**

  | Pattern       | Phase set                    | Example          | Machine does                            | Saga does                              |
  | ------------- | ---------------------------- | ---------------- | --------------------------------------- | -------------------------------------- |
  | Auto-compute  | `MACHINE_COMPUTED_PHASES`    | `calculations`   | `assign()` on entry                     | Signal-only `sagaPhaseComplete`        |
  | Wait-for-user | `MACHINE_INTERACTIVE_PHASES` | `news`           | Waits for `ADVANCE`                     | `waitFor(actor)` + `sagaPhaseComplete` |
  | Saga-owned    | (everything else)            | `action`, `seed` | Passively observes via `PHASE_COMPLETE` | Runs full logic                        |

- **`ADVANCE` event added to gameMachine** — same transitions as `PHASE_COMPLETE` in `executingPhases` (advance to next phase or roundEnd). The two events are functionally identical; the distinction is semantic (user vs saga bridge).
- **Sync middleware changes:**
  - `MACHINE_OWNED_PHASES` split into `MACHINE_COMPUTED_PHASES` (calculations) and `MACHINE_INTERACTIVE_PHASES` (news)
  - `advance()` → `ADVANCE` bridge added, **gated by `MACHINE_INTERACTIVE_PHASES`**: only forwards when the machine's `currentPhase` is a machine-interactive phase. Without this guard, advance clicks during saga-owned phases (event, gameday, etc.) double-advance the machine.
  - `sagaPhaseComplete` handler now has 3 branches: computed (machine→Redux + `PHASE_COMPLETE`), interactive (Redux→machine sync only, NO `PHASE_COMPLETE` — machine already advanced), saga-owned (Redux→machine + `PHASE_COMPLETE`)
- **`src/sagas/phase/news.ts` rewritten:** `take(advance)` → `waitFor(actor, snap => snap.context.currentPhase !== "news")` using XState's `waitFor` + `getGameActor()`
- **Key bug found and fixed:** The `advance()` bridge initially fired unconditionally, sending `ADVANCE` to the machine on every advance click regardless of the current phase. This caused the machine to silently advance past "news" before the saga reached it, so `waitFor` resolved immediately and the news screen was skipped. Fix: gate the bridge on `MACHINE_INTERACTIVE_PHASES.has(currentPhase)`.
- **Lesson: gate all Redux→XState bridges on machine state.** Any Redux action forwarded to the game actor must check that the machine is in a state that expects it. Otherwise the action has unintended side effects on future states.
- 6 new tests (`news-phase.test.ts`) — ADVANCE transitions, interleaving with PHASE_COMPLETE, last-phase-in-round, async `waitFor` pattern. 305 total across 22 test files.

**PR 11: Game setup machine — `pickingManager` in appMachine**

- **Scope:** Own the "new game" flow from "Uusi peli" click through manager creation, as a compound `starting` state in `appMachine`.
- **Current flow:** User clicks "Uusi peli" → `dispatch(startGame())` → appMachine enters `starting` → `ManagerForm` shown → user submits → `dispatch(advance(formValues))` → meta saga's `take(advance)` catches it → `addManager(payload)` → `gameStartAction()` → `fork(gameLoop)`.
- **New flow:** `starting` becomes a compound state with `pickingManager` as initial sub-state. The machine waits for `SUBMIT_MANAGER` with form payload, stores it in context. Meta saga uses `waitFor(appActor)` instead of `take(advance)`, reads form values from machine context, then runs `addManager()` + `gameStartAction()` as before.
- **What moves to machine:** Flow gating (when to accept form submission). Form data lives in machine context briefly.
- **What stays in saga:** `addManager()` (dispatches to Redux: `managerAdd`, `teamAddManager`), `gameStartAction()`, `fork(gameLoop)`.
- **Component changes:** `ManagerForm.advance` callback bridges through middleware (`advance(formValues)` → `SUBMIT_MANAGER` on appMachine, gated by machine state). `StartMenu.tsx` reads `state.matches("starting.pickingManager")` instead of `state.matches("starting")`.
- Pattern: wait-for-user (appMachine)

**PR 12: `selectStrategy` + `championshipBetting` sub-states**

- **Scope:** Add `selectStrategy` and `championshipBetting` as interactive sub-states in the start-of-season flow, after the saga runs `seasonStart()`.
- **Current flow:** `startOfSeasonPhase` saga calls `seasonStart()` → `selectStrategy()` (sets phase to `"select-strategy"`, `take(managerSelectStrategy)`) → `championshipBetting()` (sets phase to `"championship-betting"`, `race(take(requestChampionBet), take(advance))`).
- **New flow:** Machine waits for `SELECT_STRATEGY` and `PLACE_BET`/`SKIP_BET` events. Saga uses `waitFor` for each interactive gate. `seasonStart()` stays in saga — it's a complex generator with `select`/`put`/`call` chains.
- Pattern: wait-for-user (gameMachine)

**PR 13: De-sagaize `seasonStart()` + competition seeding**

- **Scope:** Convert `seasonStart()` from a saga generator to a pure function that returns context updates. Move competition seeding logic out of saga generators.
- **Current complexity:** Team re-strengths (uses `teamData[id].strength()` — has randomness!), competition starts (saga calls per competition), salary calculations (reads manager state), extra resets.
- **What needs solving:** `teamData[id].strength()` calls the `RandomService` — need DI for deterministic seeding in tests. Competition start sagas may have side effects.
- Pattern: auto-compute (with RNG DI)

### Phase 2.5: Remaining game loop phases (PRs 14+)

_PR numbers and scope below are **provisional** — will be revised after PRs 11–13 based on lessons learned. The three established migration patterns (auto-compute, wait-for-user, saga-owned) inform which phases can be tackled next._

**Interactive game loop phases:**

- `action` — compound state: buy/sell player, toggle service, crisis meeting, improve arena, order prank, accept invitation, place bet, save game. Most complex interactive phase.
- `gameday` — compound: wait-for-start → playing (simulation) → wait-for-results → done. Multi-advance. Most complex saga.
- `event` — compound: auto-resolving → waiting-for-resolution → processing → done. Guards on `allEventsResolved`.
- `gala` — wait-for-user (simple)
- `endOfSeason` — compound: world championships → awards → promotion/relegation → stories → done
- `invitationsCreate` / `invitationsProcess` — may be auto-compute or wait-for-user

**Event system migration (96 files):**

- Event command infrastructure (`EventCommand[]` interpreter)
- Batch 1: ~50 simple auto-resolve events (mechanical transform)
- Batch 2: ~46 complex events with options/resolve/process

**Remaining saga migrations:**

- Betting, manager actions, stats/awards, prank/invitation, gameday simulation

**Cleanup:**

- Delete Redux infrastructure, remove packages, final documentation

---

## Risk Assessment

| Risk                                        | Severity    | Mitigation                                                                                                                                                                     |
| ------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Phase sequencing breaks                     | 🔴 Critical | Regression tests (PR 1) catch ordering issues. Calendar-driven tests verify exact phase sequence per round.                                                                    |
| Event conversion introduces bugs            | 🟡 High     | Mechanical transform + command interpreter tests. Each event file gets a before/after comparison.                                                                              |
| Save/load format change                     | 🟡 High     | Clean break decided. New format is just `JSON.stringify(gameMachine.context)`.                                                                                                 |
| Performance (96 event files importing ctx)  | 🟢 Low      | Events receive context snapshot, not subscription. No re-render cost. XState 5 batches context updates.                                                                        |
| Circular dependencies in machine            | 🟢 Low      | `gameMachine` is single file with `setup()`. Event files import types only, not the machine.                                                                                   |
| Component migration volume (~38 components) | 🟡 Medium   | Components only change import path (`useAppSelector` → `useSelector` from `@xstate/react`). Selector function signatures are identical.                                        |
| Long-lived branch merge conflicts           | 🟡 High     | Small PRs, merge frequently, avoid parallel work on same files.                                                                                                                |
| Bidirectional sync ordering                 | 🟡 High     | `syncFromMachine` must reach Redux before `sagaPhaseComplete` fires. Tests verify ordering. Temporary scaffolding — deleted when Redux dies.                                   |
| Redux→XState bridge side effects            | 🟡 High     | All Redux action bridges must be gated by machine state. Ungated `advance()` bridge caused silent phase-skipping bug (PR 10). Pattern: check `currentPhase` before forwarding. |

---

## Size Estimate

| Phase                              | Files Touched         | Estimated PRs   | Complexity  |
| ---------------------------------- | --------------------- | --------------- | ----------- |
| Phase 0: Foundation                | ~5                    | 3 ✅ (3/3)      | Medium      |
| Phase 1: Simple stores + app shell | ~20                   | 3 ✅ (3/3)      | Low–High    |
| Phase 2: Game machine core         | ~40                   | 7 (4/7)         | Very High   |
| Phase 2.5+: Remaining phases       | ~150                  | TBD after PR 13 | High–V.High |
| **Total**                          | **~150 unique files** | **~20–25 PRs**  |             |
