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
└── state: "in_game"
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
  - States: `menu` → `starting`/`loading` → `"in_game"`
  - Events: `START_GAME`, `LOAD_GAME`, `GAME_STARTED`, `GAME_LOADED`, `QUIT`
  - Exported: `appMachine` definition + `GameMachineEvents` type
- Created `src/machines/actors.ts` — centralized actor instantiation point
  - Pattern: machine files export pure definitions, `actors.ts` creates and starts singleton actors
  - Future machines will have their actors created here too
- Extended `src/stores/sync.ts` — bridges Redux meta actions → machine events
  - `startGame` → `START_GAME`, `loadGame` → `LOAD_GAME`, `gameLoaded` → `GAME_LOADED`
  - `seasonStart` → `GAME_STARTED` (fires every season, not just first — machine silently ignores in `"in_game"`)
  - `quitToMainMenu` → `QUIT`
- `App.tsx` reads `state.matches("in_game")` via `useSelector(appActor, ...)` from `@xstate/react`
- `StartMenu.tsx` reads `state.matches("starting")` via `useSelector(appActor, ...)`
- `inspector.ts` registers `appActor` via `appActor.system.inspect(inspect)` (machine actors use system, not direct)
- 16 unit tests in `src/__tests__/game-machine.test.ts`
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

---

## ⚠️ PIVOT (2026-04-25): The bridge was the product

After PRs 9–10 the dual-write Redux↔XState bridge was on track to grow without bound. Each migrated phase added new sync rules (`MACHINE_COMPUTED_PHASES`, `MACHINE_INTERACTIVE_PHASES`), more bridge gates ("only forward `advance` when …"), and another round-trip ordering invariant to test. The scaffolding was becoming the product.

**Decision:** stop trying to keep Redux and XState in lockstep. Accept that **the game will not work for a while**, rip out the bridge, and rebuild on top of XState as the single source of truth. Keep what's good (services, data, types, vanilla extract, react-hook-form, the auto-compute and wait-for-user patterns from PRs 9–10), discard the dual-write plumbing.

### What was removed (2026-04-25)

- `src/stores/sync.ts` — the 270-line dual-write middleware
- `src/machines/game.ts` — the passive-observer `gameMachine` (round/phase tracking only worked because the saga drove it)
- `src/machines/calculations.ts` — pure phase function whose only consumer was the gameMachine
- `src/machines/actors.ts` — trimmed from ~165 lines (gameActor lifecycle + microdiff dev logger) to **5 lines** (just `appActor`)
- `microdiff` devDep
- 5 bridge tests: `bidirectional-sync`, `phase-tracking-bridge`, `calculations-phase`, `news-phase`, `game-machine`
- Action creators: `syncFromMachine`, `sagaPhaseComplete` (deleted from `src/ducks/game.ts`)
- All `addCase(syncFromMachine, …)` handlers across 10 ducks
- `waitFor(actor, …)` from `src/sagas/phase/news.ts` (reverted to canonical `take(advance)`)
- 12 `sagaPhaseComplete` puts from `src/sagas/game.ts` gameLoop

### What was kept

- `appMachine` in `src/machines/app.ts` — lifecycle (menu / starting / loading / "in_game"). Holds default `GameContext`. Now THE master machine.
- `appActor` singleton in `src/machines/actors.ts`
- `@xstate/store` instances for `ui`, `country`, `notification` (small, isolated, no overlap with the bridge mess)
- Stately Inspector wiring (`src/stores/inspector.ts`) — works for `appActor` and the small stores
- `src/services/persistence.ts` (extracted in PR 6, still useful)
- `src/state/` (NEW) — type extraction unifying every duck shape
- The two migration patterns from PRs 9–10 (**auto-compute**, **wait-for-user**) — still valid; they apply to actions/states inside `appMachine`, not a separate gameMachine
- All 305 (now 218) regression tests that don't depend on the bridge

### What changed in approach

| Old plan                                                                  | New plan                                                                                                 |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Two machines: `appMachine` (lifecycle) + `gameMachine` (round/phase)      | **One machine: `appMachine`.** The game IS the app. Round/phase becomes nested states under `"in_game"`. |
| Dual-write Redux + XState in lockstep, sync middleware bridges both ways  | Redux dies progressively. XState owns context as features migrate. No bridge.                            |
| Migrate phase-by-phase while game stays playable                          | Game breaks during migration; bring it back up feature-by-feature on top of XState.                      |
| `GameContext` type lives in `src/machines/types.ts`                       | `GameContext` lives in `src/state/` (one slice file per duck shape, single barrel)                       |
| 96 event files: command-returning functions interpreted by command runner | Same target, but integrated directly into `appMachine` actions — no Redux side                           |

---

## New Plan (2026-04-25 forward)

### Architecture

```
appMachine (THE machine, holds full GameContext)
├── menu            ← splash, no game in progress
├── starting        ← compound: pickingManager → ready
├── loading         ← restoring from localStorage
└── "in_game"          ← compound (round/phase loop)
    ├── roundStart      ← look up calendar entry, populate phase queue
    ├── executingPhases ← compound (one state per phase type)
    │   ├── action          ← wait-for-user (player commands)
    │   ├── prank           ← wait-for-user
    │   ├── gameday         ← compound (simulate → results → confirm)
    │   ├── calculations    ← auto-compute
    │   ├── eventCreation   ← auto-compute (event command interpreter)
    │   ├── event           ← wait-for-user (resolve, then process)
    │   ├── news            ← wait-for-user
    │   ├── invitationsCreate / invitationsProcess
    │   ├── startOfSeason   ← compound (selectStrategy → championshipBetting)
    │   ├── seed            ← auto-compute
    │   ├── gala            ← wait-for-user
    │   └── endOfSeason     ← compound (worlds → awards → promo/rel → stories)
    └── roundEnd        ← bump turn, loop or transition to next season
```

### Established conventions (carry forward from PRs 9–10)

- **Pure phase functions** — `(ctx: GameContext) => Partial<GameContext>` using `produce()`. No saga calls, no I/O, no `select`. Auto-compute pattern.
- **Wait-for-user gating** — interactive states transition only on a specific event from the user (e.g. `ADVANCE`, `SELECT_STRATEGY`, `BUY_PLAYER`).
- **Machine files stay pure** — `src/machines/*.ts` exports the definition only. Side-effect-laden actor instantiation lives in `src/machines/actors.ts`.
- **`structuredClone(def.data)` for default context** — kills the Stately Inspector reference-dedup bug class entirely (see AGENTS.md).
- **Page/leaf component boundary** — pages may call `useSelector(appActor, …)` and `appActor.send(…)`. Leaf components stay store-agnostic (props in, callbacks out).

### Migration patterns (locked, established 2026-04-26)

These are the rules every phase port must follow. Deviating means flagging it in the PR.

#### Action shape

- **Always `setup({ actions: { foo: assign(…) } })` + referenced `{ type: "foo", params: ({event}) => event.payload }`** at the call site. Never inline function-form actions in `on:` handlers — they trigger XState's `executingCustomAction` dev-mode warning the moment they spawn or send.
- **`enqueueActions(({context, enqueue}, params) => …)`** is the official escape hatch when one event handler needs both `assign` _and_ `sendTo` _and_ a value computed once that both reference (e.g. random skill roll feeding the assign and the notification message). Don't degrade to inline action arrays when a value is shared.
- **State mutation is `assign(({context}) => produce(context, (draft) => …))`.** Period. No spread-based nested updates. Immer is mandatory for anything deeper than a top-level field.
- **Two-transition pattern for guarded events with feedback.** When the failure path needs UI feedback (e.g. "Myyntilupa evätty"):
  ```ts
  SELL_PLAYER: [
    { guard: (...) => canSell(...)(ctx), actions: "executeSellPlayer" },
    { actions: { type: "notify", params: () => ({ ... }) } }
  ]
  ```
  Don't silently swallow rejected events.

#### Guards as shared predicates

- Predicates that gate **both** UI affordances (`disabled` props) and machine transitions live in `src/machines/selectors.ts` as curried `ContextSelector<boolean>`:
  ```ts
  export const canSellPlayer =
    (manager: string): ContextSelector<boolean> =>
    (ctx) => /* … */;
  ```
- Consumed identically by both worlds:
  - UI: `const ok = useGameContext(canSellPlayer(manager.id));`
  - Machine: `guard: ({context, event}) => canSellPlayer(event.payload.manager)(context)`
- **Never duplicate the rule.** If the UI condition and the machine guard ever drift, you've broken the contract.
- **Selectors must stay pure.** Push data lookups (e.g. `prankTypes[type].price(competition)`) to the call site and pass the result in as a parameter — selectors that import data files invite circular dep chains (`selectors → game/pranks → sagas → selectors`).

#### Per-competition behavior

- When a phase action needs competition-specific logic, **add an optional method on `CompetitionDefinition`** instead of branching on `competitionId === "ehl"` inside the machine action.
- Signature: `(draft: Draft<GameContext>, args: { phase, groupIdx, group }) => void`. **Do not hide immer.** Competitions participate in the same `produce()` pass as the surrounding phase action — pretending otherwise just means they spin up their own `produce` internally. `Draft<GameContext>` in the signature is honest about what these functions do.
- **Co-locate the data.** EHL awards table + Finnish text live in [src/data/competitions/ehl.ts](src/data/competitions/ehl.ts). Tournament prize amounts live in [src/data/competitions/tournaments.ts](src/data/competitions/tournaments.ts) reading from `tournamentList`. PHL/division omit the field. Default behavior is no-op via optional chaining (`competitionDef.groupEnd?.(…)`).
- This shape generalizes: same pattern works for `groupEnd` (today), future `afterMatch` (per-game manager bookkeeping), future `start`/`end` lifecycle hooks. The machine layer stays competition-agnostic.

#### Phase function extraction (when machines grow)

When a single action grows beyond ~50 lines, extract — but follow these rules:

- **Pure phase functions** `(ctx: GameContext, params?) => GameContext` are the gold standard. No XState types in the signature, trivially testable as `f(ctx) === expected`. Wire them in the machine as `assign(({context}, params) => phaseFn(context, params))`.
- **Draft mutators** `(draft: Draft<GameContext>, …) => void` are the right tool for sub-steps inside a phase function's `produce()` pass. Pass the draft around freely.
- **Do NOT extract whole `assign(…)` action objects to other files.** XState's generic juggling makes them painful to type without the `setup()` callback context. Extract the _work_, keep the _wiring_ in the machine file.
- **Reminder: state-narrowed `event` is a `setup()`-callback-only superpower.** Extracted helpers receive the full event union, or take a typed `params` object instead. The narrowing only happens inside the machine's `setup({actions: …})` callbacks.

#### Stately Inspector hygiene

- The inspector dedupes shared object references and stubs them as `"[...]"` placeholders.
- **Always pass fresh refs into machine context.** `[...managerDefs]`, `structuredClone(competitionData)`, etc. — never the imported singleton. See [src/state/defaults.ts](src/state/defaults.ts).
- Symptom of getting this wrong: long arrays in DevTools that look truncated past index ~9, or fields displaying as `"[...]"` after the first occurrence.

### Declarative event + prank patterns (locked, established 2026-04-26)

The 96-event saga pile and the prank phase landed declaratively in one push. These rules apply to every future event/prank port.

#### Event shape: `DeclarativeEvent<TData, TCreationData>`

```ts
type DeclarativeEvent<TData, TCreationData = BaseEventCreationFields> = {
  type: "manager" | …;
  create: (ctx: GameContext, seed: TCreationData) => Omit<TData, "id">;
  options?: (ctx: GameContext, data: TData) => Record<string, string>;
  resolve?: (ctx: GameContext, data: TData, value?: string) => TData;
  render: (data: TData) => string[];
  process?: (ctx: GameContext, data: TData) => EventEffect[];
};
```

Second generic types the **creation seed**. Prank-spawned events take `PrankInstance`; system events take `{ manager: string }` (the `BaseEventCreationFields` default).

#### Three event archetypes

| Archetype       | `resolved` at create | `options` | `resolve` | Use when                                                                                  |
| --------------- | -------------------- | --------- | --------- | ----------------------------------------------------------------------------------------- |
| Pre-resolved    | `true` (literal)     | —         | —         | Outcome is fully determined by `(ctx, seed)` at create time (e.g. `bazookaStrike`)        |
| Auto-resolve    | `false`              | —         | required  | Random roll determines outcome; no UI input (e.g. `sellNarcotics`, `protest`, `kasino`)   |
| Interactive     | `false`              | required  | required  | Player chooses from `options()`, `resolve(ctx, data, value)` snapshots the choice         |

#### Walker discipline (event-phase `entry`)

The walker iterates `event.events` looking for `!processed` entries:

- **`!resolved && def.options`** → leave alone (interactive, waits for `RESOLVE_EVENT`)
- **`!resolved && !def.options`** → call `resolve()`, then `process()` ⇒ apply effects ⇒ mark `processed`
- **`resolved && !processed`** → skip resolve, call `process()` ⇒ apply effects ⇒ mark `processed`

**Drafting note:** the saga handled all three archetypes correctly via a three-step pipeline (`autoResolve → wait-for-player → processEvents`). An early draft of the machine walker mimicked only step 1 (`!resolved && autoResolve`) and never picked up pre-resolved events — they sat visible but inert. Fixed by keying on `!processed` and folding all three steps into one immer pass. The saga was never wrong about this; the interim machine code was.

#### Random discipline (mandatory)

- **Every random roll lives in `resolve`.** Result snapshotted onto the payload (`skillLost`, `caught`, `success`, …).
- **`process` is deterministic** over `(ctx, data)`.
- **Why:** `process` runs again after restoring a save. If randomness leaks into `process`, the same saved game produces different outcomes after load.

Reference implementations: [src/game/new-events/sell-narcotics.ts](src/game/new-events/sell-narcotics.ts), [src/game/new-events/protest.ts](src/game/new-events/protest.ts).

#### Effect interpreter with injected `SpawnEventFn`

```ts
type SpawnEventFn = (
  draft: Draft<GameContext>,
  eventId: string,
  seed: BaseEventCreationFields
) => void;

applyEffects(
  draft: Draft<GameContext>,
  effects: EventEffect[],
  spawn: SpawnEventFn
): void
```

The `spawnEvent` variant of `EventEffect` lets pranks (and future events) chain into the event registry. The machine layer holds the registry and provides the closure. **Why injected:** event files import from `event-effects.ts`, so `event-effects.ts` cannot import the registry without a cycle.

#### Pranks are declarative

```ts
type DeclarativePrank = {
  name: string;
  price: (competition: string) => number;
  orderMessage: (prank: PrankInstance) => string;
  execute: (ctx: GameContext, prank: PrankInstance) => EventEffect[];
};
```

Most pranks return `[{ type: "spawnEvent", eventId, seed: prank }]` — the prank-phase action runs, queue clears, and the spawned event lands in the upcoming event phase. `fixedMatch` is the outlier — it returns a direct `addTeamEffect`. **No saga, no generators.**

The prank-phase machine action ([src/machines/game.ts](src/machines/game.ts) `executePranks`) is one immer pass:

```ts
for (const prank of draft.prank.pranks) {
  const def = prankTypes[prank.type];
  if (!def) continue;
  applyEffects(draft, def.execute(draft, prank), spawnEvent);
}
draft.prank.pranks = [];
```

#### `SnapshotSelector<T>` for state-aware predicates

```ts
type SnapshotSelector<T> = (snap: SnapshotFrom<typeof gameMachine>) => T;
```

When a predicate depends on the **state node** in addition to context (e.g. "advance is enabled unless we're in the event phase with unresolved events"), use `SnapshotSelector` instead of `ContextSelector`. The canonical example:

```ts
export const advanceEnabled: SnapshotSelector<boolean> = (snap) =>
  !snap.matches({ in_game: { executing_phases: "event" } }) ||
  allEventsResolved(snap.context);
```

Components consume via `GameMachineContext.useSelector(advanceEnabled)`. Use `ContextSelector<T>` for everything else (the vast majority of selectors stay context-only).

#### Calendar flags `createRandomEvent` / `pranks` are redundant

The phase guard (`has_phase("event_creation")`, `has_phase("prank")`) handles gating. The flags were a saga-era workaround. Removed from playoff round entries during this work — leave the rest alone unless the pattern recurs.

### Roadmap

PR numbers below are sequential markers, not commitments. Each step ends with `pnpm typecheck && pnpm test --run && pnpm build` green.

#### PR P1: Persistence (save/load) on `appMachine` ✅ COMPLETE

**Landed 2026-04-26.**

- Slot-based persistence service: `saveSnapshot(slot, snap)` / `loadSnapshot(slot)` / `hasSnapshot(slot)` in [src/services/persistence.ts](src/services/persistence.ts). Storage key `mhm97:slot:N`. Only slot 1 is wired up for now; the slot-picker UI lands later (MHM 2000 had 6 slots).
- The persisted payload is the **gameRef's full XState snapshot** (`actor.getPersistedSnapshot()`), not just `GameContext`. This was a deliberate departure from the original PR P1 plan — `getPersistedSnapshot()` captures invoked children (incl. the in-game championship-betting wizard, notification subtree, etc.) automatically.
- `appMachine` extended:
  - New event `SAVE_GAME` with a guard `context.gameRef !== undefined`, two actions: a referenced `persistSnapshot` action that calls `saveSnapshot()`, then `sendTo(gameRef, { type: "SAVED" })` so the game can surface its own "Peli tallennettiin." notification via the existing `notify` action.
  - `loading` state invokes a `fromPromise` actor that returns the snapshot (or throws → `onError` falls back to `menu`).
  - `playing.entry` now uses **`createActor(gameMachine, ...)`** instead of `spawn(gameMachine, ...)`. This is the only way to hydrate from a persisted snapshot in XState 5 — `spawn()` doesn't accept a `snapshot` option, only the root-level `createActor()` does. Trade-off: gameRef is now its own root actor system rather than an `appActor` child, so `stopChild` is replaced with `gameRef.stop()` in `playing.exit`. We lose the `systemId: "game"` registration, which was used by no production code.
- [src/components/ActionMenu.tsx](src/components/ActionMenu.tsx) save button calls `appActor.send({ type: "SAVE_GAME" })`.
- Redux save/load fully removed: `gameSave` saga, `META_GAME_SAVE_REQUEST` `takeEvery`, the `saveGame` createAction in `src/ducks/meta.ts`. Old `saveGame(state)`/`loadGame()` functions in `persistence.ts` replaced.
- 4 new persistence tests (round-trip, slot isolation, `hasSnapshot`, etc.) + 5 new app machine tests (load/save flows). 228/228 total.
- **Acceptance verified:** New Game → play → Save → notification fires → Quit → Load Game → game resumes with championship-betting wizard state intact.

##### Why snapshot persistence beats context-only

Persisting `GameContext` alone would lose the gameMachine's state node (where in the round/phase loop), all invoked children (notification timers, championship-betting modal state), and the round-management scratch fields (`currentRoundCalendar`, `remainingPhases`, `currentPhase`). Snapshot persistence inverts the problem: we treat the snapshot as opaque, hand it to `createActor`, and XState restores all of it (recursively) for free. The cost is a slightly larger localStorage payload, which doesn't matter at this scale.

##### Why `createActor` over `spawn`

XState 5's `spawn()` accepts `input` but not `snapshot`. Restoring an actor from a persisted snapshot requires `createActor(machine, { snapshot })`. Inside a machine's `assign`, `spawn` is the only built-in factory — so to use `createActor` we need the function-form `assign(({ context }) => …)`. That's what `playing.entry` does now. We also lose the actor system registration (no `systemId`), which is fine because the gameRef is held in app context anyway.

##### Why `SAVE_GAME` uses a referenced action + `sendTo`

The first cut used a function-form action that did `saveSnapshot(...)` then `gameRef.send({ type: "SAVED" })` synchronously. XState 5 dev mode fired a warning: `Custom actions should not call assign() directly`. The cause: the `SAVED` event made the game spawn a new notification child via `createActor`, which internally calls XState's `assign()` factory to wire up the child's initial context. While we're still inside a function-form action, XState's `executingCustomAction` flag is set, so any nested `assign()`/`sendTo()`/`raise()`/`emit()` factory call warns. Fix: split into a referenced `persistSnapshot` action (registered in `setup({ actions })`) for the IO and a built-in `sendTo` for the handshake. Both are first-class action descriptors, neither sets the flag.

#### PR P2: New game setup — `starting.pickingManager` ← NEXT

- `starting` becomes compound: `pickingManager` (initial) → `ready` → exits to `"in_game"` via `GAME_STARTED`.
- `pickingManager` waits for `SUBMIT_MANAGER { managerData }`. The action mutates context (`manager.active`, `manager.managers[id]`, team's `manager` field) directly via `assign + produce`.
- `ManagerForm.tsx` calls `appActor.send({ type: "SUBMIT_MANAGER", ... })` instead of `dispatch(advance(formValues))`.
- **Removes:** the Redux meta saga's "wait for advance after startGame" branch, the `addManager` saga helper, the `gameStartAction()` chain.
- **Acceptance:** new game flow works end-to-end without Redux for the setup phase. State after submit is a valid in-game `GameContext`.

#### PR P3: First in-game phase on the machine — `roundStart` + `news` (proof of concept)

- Extend `"in_game"` with the round/phase compound state shown in the architecture diagram.
- Wire `roundStart` to look up `calendar[turn.round]`, store `remainingPhases`, and transition to `executingPhases.<first phase>`.
- Implement only `news` first (simplest interactive phase): on entry it consumes one news item, transitions on `ADVANCE`.
- Components: `News.tsx` reads from `useSelector(appActor, …)` + sends `ADVANCE`. No Redux involvement.
- The Redux saga gameLoop keeps running in parallel for OTHER phases — but `news` is now machine-driven. We accept dual presentation in the UI temporarily.
- **Acceptance:** news phase works visually under the machine, even if the rest of the loop is broken.

> ⚠️ At this point the game is officially broken. From here on we rebuild phase-by-phase on the machine and **delete the corresponding saga + Redux pieces immediately** rather than dual-running.

#### PR P4: `calculations` (auto-compute, port from PR 9)

- Re-introduce the deleted `src/machines/calculations.ts` as an action invoked on entry to `executingPhases.calculations`.
- Delete `src/sagas/phase/calculations.ts` (it was restored after the bridge purge — re-delete it once the machine owns the phase).
- **Acceptance:** team readiness, manager balances, expired effects all update correctly.

#### PR P5: `seed` + competition lifecycle (auto-compute with RNG DI)

- Move `competitionStart` / `seedPhase` logic into a pure function that accepts `(ctx, random)` and returns `Partial<GameContext>`.
- Pass the `RandomService` singleton in. Tests pass a seeded instance.
- **Acceptance:** PHL/division/EHL/tournaments all seed correctly. Deterministic with `VITE_RANDOM_SEED`.

#### PR P6: `action` phase — the big one

- Compound state with one transition per player command: `BUY_PLAYER`, `SELL_PLAYER`, `TOGGLE_SERVICE`, `IMPROVE_ARENA`, `CRISIS_MEETING`, `ORDER_PRANK`, `ACCEPT_INVITATION`, `PLACE_BET`, `SAVE`, `ADVANCE`.
- Each action becomes a pure context mutation. Cross-cutting effects (e.g. accepting an invitation moves teams between competitions) all happen inside `assign + produce`.
- Components: `ActionMenu`, `Services`, `Arena`, `TransferMarket`, `CrisisActions`, `Pranks`, `Invitations`, `Betting` rewired to send events on `appActor`.
- Delete `src/sagas/manager.ts`, `src/sagas/betting.ts`, `src/sagas/invitation.ts`, `src/sagas/prank.ts` as their concerns get covered.
- **Acceptance:** complete a full action phase (buy a player, save, advance) end-to-end.

#### PR P7: `gameday` — multi-state simulation

- Compound state: `wait-for-start` (advance to begin) → `playing` (run simulation) → `results` (display) → `done`.
- Simulation lives in a pure function `simulateGameday(ctx, random) → Partial<GameContext>`.
- **Acceptance:** play a full gameday round, see results, advance.

#### PR P8: `event` system — command interpreter + 96 event files

**🟡 IN PROGRESS as of 2026-04-26.** Foundation complete + 9 events ported (out of ~96).

- ✅ Event registry at [src/game/new-events/](src/game/new-events/) — `index.ts` export, currently 9 events: `pirka`, `jaralahti`, `jobofferPHL`, `kasino`, `bloodbath`, `russianAgent`, `bazookaStrike`, `sellNarcotics`, `protest`.
- ✅ Effect interpreter at [src/game/event-effects.ts](src/game/event-effects.ts) with injected `SpawnEventFn`.
- ✅ Three machine states fully wired:
  - `event_creation` (entry-driven, calls `spawnEvent` with `{ manager }` seeds)
  - `event` (entry walks unresolved events, `RESOLVE_EVENT` for interactive, `ADVANCE` guarded by `allEventsResolved`)
  - `prank` (entry runs `executePranks`, auto-advances)
- ✅ All conventions locked (see "Declarative event + prank patterns" above).
- ✅ Pre-resolved event walker bug fixed (`!processed` not `!resolved`).
- 🔄 **Remaining: ~87 events to port** from [src/game/events/](src/game/events/) (saga generators) to [src/game/new-events/](src/game/new-events/) (declarative). Convert in clusters by archetype: easiest are auto-resolve manager events with simple `EventEffect` outputs.
- ❌ Once all events are ported, delete `src/sagas/phase/event.ts`, `src/sagas/phase/event-creation.ts`, `src/sagas/phase/prank.ts`, `src/sagas/event.ts`, `src/game/events.ts`, `src/game/events/`. The legacy `src/game/events/` directory remains as REFERENCE-ONLY pending the bulk port.

##### Per-event porting checklist

For each saga event being ported:

1. Identify archetype (pre-resolved / auto-resolve / interactive) by looking at the saga `create`/`resolve`/`options`/`process`.
2. Move all random rolls into `resolve` (or `create` for pre-resolved). Snapshot results to the payload.
3. Convert `process` to return `EventEffect[]` instead of `yield put(...)`.
4. Add to [src/game/new-events/index.ts](src/game/new-events/index.ts).
5. Smoke-test in the GUI (use `DeveloperMenu.tsx` to spawn the event manually).
6. Delete the corresponding file in [src/game/events/](src/game/events/).

#### PR P9: Remaining phases

- `prank` ✅ COMPLETE (landed alongside event system, see PR P8)
- `gala` (wait-for-user)
- `invitationsCreate` / `invitationsProcess` (auto-compute)
- `startOfSeason` compound (`selectStrategy` → `championshipBetting`)
- `endOfSeason` compound (worlds → awards → promotion/relegation → stories)

#### PR P10: Rip Redux out

- Delete `src/store.ts`, `src/getSagas.ts`, `src/config/redux.ts`, `src/ducks/`, `src/sagas/`.
- Remove `redux`, `react-redux`, `@reduxjs/toolkit`, `redux-saga`, `typed-redux-saga` from `package.json`.
- Replace `useAppSelector`/`useAppDispatch` call sites (any survivors) with `useSelector(appActor, …)` and `appActor.send(…)`.
- Delete `selectors.ts` if all selectors moved to `src/machines/selectors.ts` already.
- **Acceptance:** `grep -r "redux" src/` returns nothing.

#### PR P11: Final cleanup

- Move `src/state/` types into `src/machines/` if appropriate, or keep as the public state surface
- Bundle audit, docs pass, README update
- Final regression test sweep

---

## What "the game does not work for a while" means concretely

After the bridge purge (today), the game's lifecycle (menu / new-game form / load) still works because `appMachine` owns it and Redux never owned it cleanly. **Once gameplay starts (`"in_game"`), the saga gameLoop runs but is no longer observed by any machine** — Redux is the only source of truth for game state. UI components still read from Redux via `useAppSelector`, so visually the game continues to work.

The breakage starts at PR P3, when we move the first in-game phase (`news`) onto the machine. From there until PR P9 finishes, **some phases will be machine-driven, others saga-driven, with no synchronization between them**. Expect:

- Crashes and missing data when the saga runs a phase the machine doesn't know about (and vice versa)
- UI showing stale or inconsistent state
- Save files only working within a single migration step

This is acceptable because:

1. There's no production user — only us
2. Rebuilding incrementally on a clean foundation is faster than maintaining the bridge
3. Each PR has narrow acceptance criteria; we don't need the whole game to work, just the new piece

---

## Risk Assessment

| Risk                                        | Severity    | Mitigation                                                                                                                                                                                                                                                              |
| ------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase sequencing breaks                     | 🔴 Critical | Regression tests (PR 1) catch ordering issues. Calendar-driven tests verify exact phase sequence per round.                                                                                                                                                             |
| Event conversion introduces bugs            | 🟡 High     | Mechanical transform + command interpreter tests. Each event file gets a before/after comparison.                                                                                                                                                                       |
| Save/load format change                     | 🟡 High     | Clean break decided. New format is just `JSON.stringify(gameMachine.context)`.                                                                                                                                                                                          |
| Performance (96 event files importing ctx)  | 🟢 Low      | Events receive context snapshot, not subscription. No re-render cost. XState 5 batches context updates.                                                                                                                                                                 |
| Circular dependencies in machine            | 🟢 Low      | `gameMachine` is single file with `setup()`. Event files import types only, not the machine.                                                                                                                                                                            |
| Component migration volume (~38 components) | 🟡 Medium   | Components only change import path (`useAppSelector` → `useSelector` from `@xstate/react`). Selector function signatures are identical.                                                                                                                                 |
| Long-lived branch merge conflicts           | 🟡 High     | Small PRs, merge frequently, avoid parallel work on same files.                                                                                                                                                                                                         |
| Bidirectional sync ordering                 | 🟡 High     | `syncFromMachine` must reach Redux before `sagaPhaseComplete` fires. Tests verify ordering. Temporary scaffolding — deleted when Redux dies.                                                                                                                            |
| Redux→XState bridge side effects            | 🟡 High     | All Redux action bridges must be gated by machine state. Ungated `advance()` bridge caused silent phase-skipping bug (PR 10). Pattern: check `currentPhase` before forwarding.                                                                                          |
| Bridge growing without bound (post-mortem)  | 🔴 Realized | Each migrated phase added more sync rules. **Resolved by abandoning the bridge entirely (2026-04-25 pivot).** Going forward there is no bridge: features migrate one direction (Redux → XState) and Redux pieces are deleted as XState replaces them.                   |
| Game broken during migration (post-pivot)   | 🟡 Medium   | Accepted explicitly. No production users. Each PR has narrow acceptance criteria; we don't gate on full game working until P11.                                                                                                                                         |
| Stately Inspector reference dedup           | 🟢 Low      | The inspector dedupes shared object refs and stubs them as `"[...]"`, breaking the UI mid-context. Mitigation: deep-clone shared singletons (`structuredClone(def.data)`, `[...managerDefs]`) when building default context. See `src/state/defaults.ts` and AGENTS.md. |

---

## Size Estimate

| Phase                                         | Files Touched | Estimated PRs   | Complexity  |
| --------------------------------------------- | ------------- | --------------- | ----------- |
| Phase 0: Foundation                           | ~5            | 3 ✅ (3/3)      | Medium      |
| Phase 1: Simple stores + app shell            | ~20           | 3 ✅ (3/3)      | Low–High    |
| Phase 2: Game machine core (pre-pivot)        | ~40           | 4 ✅ (PRs 7–10) | Very High   |
| **Pivot (2026-04-25): bridge purge**          | ~25           | 1 ✅            | Medium      |
| Post-pivot P1–P2 (persistence + setup on app) | ~10           | 2               | Low–Medium  |
| Post-pivot P3–P9 (in-game phases on machine)  | ~80           | 7               | High–V.High |
| Post-pivot P10–P11 (Redux removal + cleanup)  | ~50           | 2               | Medium      |
| **Total (revised)**                           | **~150**      | **~22 PRs**     |             |
