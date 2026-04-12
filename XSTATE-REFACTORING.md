Implementation Plan: Full Migration from Redux + Redux Sagas to XState
Executive Summary
This is a massive, multi-month migration touching ~150 files with ~3,500 lines of saga/reducer code, ~495 yield sites across 96 event files, and 28+ components directly wired to Redux. The game engine is fundamentally a turn-based state machine with complex phase sequencing, which maps naturally to XState — but the devil is in the ~100 event generator functions and the economic side-effect orchestration layer.

Before diving in, I have several clarifying questions that will meaningfully affect the plan's structure.

Clarifying Questions
Q1: What's the regression testing strategy?
AGENTS.md mentions deterministic seeding via VITE_RANDOM_SEED is ready, but there are no existing tests for game logic (only random.test.ts and round-robin.test.ts). A migration of this scale will break things silently — the calendar/event/phase sequencing is described as a "high-risk area."

Do you want to:

(a) Build a regression test suite before starting the migration (P3 in AGENTS.md)?
(b) Build tests incrementally alongside each migration phase?
(c) Accept manual testing and ship it?
This is the single biggest risk factor. I'd strongly recommend (a) or (b).

Q2: What does "total migration" mean for the 96 event files?
Each event file (e.g., kasino.ts) is a saga generator with create, resolve, and process lifecycle functions using yield* call(), yield* put(), yield\* select(). That's 495 yield sites across 96 files.

Options:

(a) Convert events to pure functions that return "effect descriptions" (actions to dispatch, state to read) — an XState-friendly pattern where the machine interprets the descriptions. This is the cleanest end state but touches every event file.
(b) Keep event generators as-is behind an adapter layer — XState invokes them via fromCallback or fromPromise actors. Pragmatic but creates a permanent saga-shaped layer inside XState.
(c) Hybrid: Convert the orchestration (sagas/phase) to XState machines, but leave event create/resolve/process as plain async functions that the machine calls. Events become "services" that the machine invokes.
Q3: What's the target for data/awards.ts?
awards.ts is 654 lines with 67 yield sites — it's essentially a mini-saga that runs at season end, iterating all teams with randomized bonus/penalty events. Same question as Q2 but worth calling out separately since it's the densest single file.

Q4: Save/load compatibility — breaking change OK?
Currently, gameSave() does JSON.stringify(entireReduxState) → localStorage. If the state shape changes (Redux slices → XState machine contexts), existing saves break.

Options:

(a) Breaking change — announce it, wipe saves on upgrade
(b) Migration layer — load old Redux-shaped saves and transform them into XState contexts
(c) Keep the serialized shape identical — XState contexts mirror Redux state keys exactly
Q5: Is the component-store boundary staying the same?
AGENTS.md says "page components use useAppSelector/useAppDispatch, leaf components stay store-agnostic." With XState, the equivalent would be useSelector(actor) / actor.send() from @xstate/react.

Do you want:

(a) A single top-level XState actor (like a single Redux store) with useSelector for reading?
(b) Multiple actor instances composed hierarchically (e.g., a game actor spawning phase actors, manager actors, etc.)?
(c) A hybrid where some state stays in a Redux-like store (via XState's @xstate/store package) and complex flows use full XState machines?
Q6: XState @xstate/store vs full state machines?
XState 5 has @xstate/store — a Redux-like store with createStore that handles simple CRUD state. For ducks like ui.ts (24 lines, 2 actions), notification.ts (36 lines, 2 actions), and country.ts (53 lines, 2 actions), full state machines are overkill.

Do you want:

(a) Everything as XState machines (purism)?
(b) Simple ducks → @xstate/store, complex flows → full machines (pragmatism)?
Q7: Concurrency with other modernization work?
AGENTS.md lists P3 (regression tests) and P2.9 (XState expansion) as next priorities. Should this migration:

(a) Block on a test suite first?
(b) Proceed incrementally, with each phase being a standalone PR?
(c) Be one giant branch?
I'd strongly recommend (b).

Proposed Architecture
Pending answers to the above, here's the architecture I'd recommend:

Target State Machine Hierarchy
Code
appMachine (root)
├── state: mainMenu
│ ├── on NEW_GAME → gameSetup
│ └── on LOAD_GAME → invoke loadFromStorage → playing
│
├── state: gameSetup
│ └── on MANAGER_CONFIGURED → playing (spawn gameMachine)
│
└── state: playing
└── spawns: gameMachine (the engine)
│
gameMachine
├── context: { turn, flags, teams[], competitions{}, managers[], ... }
│
├── state: season
│ ├── entry: seasonStart logic (salaries, competition init)
│ ├── state: selectStrategy
│ │ └── on STRATEGY_SELECTED → championshipBetting
│ ├── state: championshipBetting
│ │ └── on BET / SKIP → round
│ └── state: round (turn loop)
│ ├── entry: read calendar[round] → determine phases
│ ├── state: action (player decision phase)
│ │ ├── spawns: actionListeners (transfer, crisis, etc.)
│ │ └── on ADVANCE → prank
│ ├── state: prank → gameday
│ ├── state: gameday
│ │ └── invoke: gamedayActor (match simulation)
│ ├── state: calculations → eventCreation
│ ├── state: eventCreation → event
│ ├── state: event (player resolves events)
│ │ └── on ALL_RESOLVED → news
│ ├── state: news → seed
│ ├── state: seed → gala (conditional)
│ ├── state: gala → endOfSeason (conditional)
│ └── state: endOfSeason → next round or next season
│
└── state: saving
└── invoke: saveToStorage
State Ownership Mapping (Redux → XState)
Current Redux Slice XState Location Rationale
game (turn, teams, competitions, flags) gameMachine.context Core game state, tightly coupled to phase transitions
manager (managers, active) gameMachine.context.managers Managers are game entities, not independent
event (events) eventPhaseMachine.context Ephemeral per-turn, naturally scoped to event phase
betting (bets, championBets) gameMachine.context.betting Cleared per turn/season, tied to game progression
stats (seasons, streaks) gameMachine.context.stats Accumulates across game, core game data
news (news, announcements) gameMachine.context.news Cleared per turn, tied to phase display
invitation (invitations) gameMachine.context.invitations Duration-based, tied to turn progression
prank (pranks) gameMachine.context.pranks Cleared per prank phase, tied to turns
notification (notifications) Separate notificationActor UI-only, fire-and-forget, independent lifecycle
country (countries) gameMachine.context.countries Simple lookup, mutated by end-of-season
meta (started, loading, saving) appMachine states These ARE states, not data — perfect for XState
ui (menu) Local React state or @xstate/store Trivial, doesn't need a machine
Migration Phases (Bottom-Up)
Phase 0: Foundation (est. ~2 PRs)
Build regression test harness — Use deterministic seed to run N seasons and snapshot state after each turn. This is the safety net for everything that follows.
Add @xstate/store dependency — For simple CRUD slices.
Establish XState actor patterns — Create typed actor system with proper context/event types.
Phase 1: Leaf State → @xstate/store (~3 PRs)
Migrate the simplest ducks that have no saga dependencies:

ui.ts → @xstate/store (24 lines, 2 actions, 0 saga deps)
notification.ts → XState machine with after delays (replaces spawn+delay saga pattern — this is a natural fit since notifications auto-dismiss)
country.ts → @xstate/store (53 lines, 2 actions, almost no saga deps)
news.ts → @xstate/store (42 lines, 3 actions, turn-clearing logic)
prank.ts → @xstate/store (31 lines, 3 actions)
Wire components to use useSelector from @xstate/react instead of useAppSelector
Phase 2: Meta/App Lifecycle → XState Machine (~2 PRs)
The meta.ts duck + sagas/meta.ts saga is a textbook state machine:

Create appMachine with states: mainMenu, loading, starting, playing
Move save/load into machine services (invoke localStorage)
Replace fork(gameLoop) + cancel(task) pattern with spawned actor
Migrate App.tsx and StartMenu.tsx to use machine state instead of state.meta.started
Phase 3: Game Loop → Core Game Machine (~4-6 PRs)
This is the heart of the migration. The gameLoop() in sagas/game.ts is a do-while(true) loop with calendar-driven phase routing — it's literally a state machine encoded as imperative code.

Create gameMachine with compound states for each phase
Phase routing becomes state transitions — calendar data drives always guards
Each phase saga becomes an invoked actor or child state:
actionPhase → compound state with parallel listeners (replaces fork/cancel)
gamedayPhase → invoked actor (complex match simulation)
eventPhase → invoked actor with interactive resolution
startOfSeasonPhase → sequential child states (strategy → betting)
endOfSeasonPhase → invoked actor (complex awards/promotion)
Simple phases (news, seed, prank, calculations) → actions on entry/exit
Turn/round advancement → self-transitions with context updates
advance action → event sent to machine (replaces take(advance) waits)
Phase 4: Manager Economic System → Machine Actions (~3 PRs)
sagas/manager.ts (354 lines) is the economic engine:

Extract pure calculation functions from saga generators (salary, service costs, crisis costs, transfer pricing)
afterGameday() logic → machine action triggered by gameday completion
Transfer market → spawned actor during action phase (replaces watchTransferMarket saga)
Balance/morale mutations → context assignments in gameMachine
Phase 5: Event System Refactor (~5-8 PRs, largest phase)
96 event files × 3 lifecycle functions × saga generators = ~495 yield sites.

Strategy: Convert events to a command pattern where each lifecycle function returns descriptions of what to do, and the machine interprets them.

TypeScript
// BEFORE (saga generator)
process: function* (data) {
yield* call(incrementBalance, data.manager, data.amount);
yield\* call(incrementMorale, data.team, 5);
}

// AFTER (command pattern)
process: (data) => [
{ type: "incrementBalance", manager: data.manager, amount: data.amount },
{ type: "incrementMorale", team: data.team, amount: 5 }
]
The event phase machine then has an effect interpreter that processes these commands.

Batch approach: Events cluster into patterns:

~30 events: just incrementBalance (simplest)
~20 events: balance + morale
~15 events: balance + strength
~10 events: with select() reads → need to read context
~10 events: with options() (user choice)
~11 events: complex (protest, job offers, attitude changes)
Convert cluster by cluster, smallest first.

Phase 6: Competition & Stats System (~3 PRs)
sagas/stats.ts → parallel actor that processes game results
sagas/gameday.ts → invoked actor for match simulation
sagas/betting.ts → machine actions for bet placement + resolution
Competition sagas → machine services for seeding and group management
data/awards.ts → pure function returning commands (like events)
Phase 7: Cleanup & Package Removal (~2 PRs)
Remove redux, @reduxjs/toolkit, redux-saga, typed-redux-saga, react-redux
Remove src/store.ts, src/config/redux.ts, src/ducks/index.ts
Remove all src/sagas/ files
Update Root.tsx to use XState provider instead of Redux Provider
Update all component imports
Risk Analysis
Risk Severity Mitigation
Silent behavior changes in game simulation 🔴 Critical Regression test harness with deterministic seeds (Phase 0)
Save/load breakage 🟡 High Either migration layer or intentional breaking change with version bump
96 event files × manual conversion 🟡 High Command pattern + bulk sed/perl transforms (proven technique from teams migration)
Phase sequencing bugs 🔴 Critical Calendar-driven state machine must match exact phase order; test each round configuration
fork/cancel patterns losing behavior 🟡 High XState spawn/stop actors map 1:1 but need careful review
Performance 🟢 Low XState is lightweight; state structure stays similar
Long-lived branch merge conflicts 🟡 High Small PRs, merge frequently, avoid parallel work on same files
Rough Size Estimate
Phase Files Touched Estimated PRs Complexity
Phase 0: Foundation ~5 2 Medium
Phase 1: Leaf State ~20 3 Low
Phase 2: Meta/App ~8 2 Medium
Phase 3: Game Loop ~30 4-6 Very High
Phase 4: Manager Economy ~25 3 High
Phase 5: Event System ~100 5-8 High (bulk)
Phase 6: Competitions/Stats ~20 3 High
Phase 7: Cleanup ~40 2 Low
Total ~150 unique files ~24-29 PRs
Key Architectural Decisions Needed
Single actor vs actor hierarchy? — I recommend a hierarchical actor model: appMachine spawns gameMachine, which spawns phase-specific actors. This maps cleanly to the current fork/cancel patterns and keeps context scoped.

Where does game state live? — In gameMachine.context. This is the single source of truth, replacing the Redux store. Components use useSelector(gameActor, snapshot => snapshot.context.teams).

How do "request" actions work? — Currently managerBuyPlayer → saga intercepts → validates → dispatches mutation. In XState: component sends BUY_PLAYER event → machine guard validates → machine action mutates context. No separate "request" vs "actual" pattern needed — the machine IS the validation layer.

What replaces select()? — Machine actions receive the full context. No need for external selectors inside the machine. Components use useSelector() from @xstate/react. Shared derived-value selectors become standalone functions that take context as input (same signatures, different source).

What I'd Start With (If Approved)
Phase 0, Step 1: Build a regression test harness that plays 3 deterministic seasons and snapshots key state after each turn. This gives us confidence to touch anything.

You asked
I'll answer the questions:

hierarchical actor model.

I agree.

yes

excellent.

Implementing hierarchical actor model

1m 5s
Thanks for confirming the 4 architectural decisions:

✅ Hierarchical actor model — appMachine spawns gameMachine, which spawns phase-specific actors
✅ Game state lives in gameMachine.context — single source of truth replacing Redux store
✅ Request actions → machine events with guards — no separate request/actual pattern needed
✅ Selectors become standalone functions taking context — same signatures, different source
That locks down the architecture. However, 7 clarifying questions from the plan (Q1–Q7) are still open, and a few of them significantly affect execution order and scope. The most critical ones:

Must-answer before starting:

Q1: Regression testing? — Do you want a test harness before we start touching sagas? (I recommended yes — the phase sequencing is fragile.) Or are you comfortable with manual testing?

Q2: The 96 event files — Convert to pure command-returning functions (clean but touches every file), keep as saga generators behind an adapter (pragmatic but permanent legacy), or hybrid (events become async functions the machine invokes)?

Q4: Save/load breaking change? — OK to wipe existing localStorage saves on upgrade, or do we need a migration layer?

Nice-to-answer but I can default:

Q6: @xstate/store for trivial ducks? — I'll default to "yes, use @xstate/store for ui, country, notification" unless you say otherwise.
Q7: PR strategy? — I'll default to "small incremental PRs, one phase at a time" unless you want a different approach.
What are your thoughts on Q1, Q2, and Q4?

You asked

Creating a regression test suite and cleaning the data layer

6m 20s
Plan approved
You asked
Implement the plan:

XState Migration Plan — Redux+Saga → XState 5 Hierarchical Actor Model

Decisions Locked

# Question Decision

Q1 Regression tests first? Yes — vitest regression harness with deterministic seed before touching sagas
Q2 96 event files? Clean break — convert from saga generators to pure command-returning functions
Q3 src/data/ cleanup? Move logic out — data/ should be pure data. Selectors, awards saga logic, tournament saga logic relocate
Q4 Save/load backwards compat? Clean break — no migration layer, localStorage format changes freely
Q5 Multiple actors vs monolith? Hierarchical actor composition — multiple actor instances, spawned by parent
Q6 @xstate/store for simple ducks? Yes for trivial ducks — ui, country, notification use @xstate/store; anything with cross-cutting logic stays in a proper machine
Q7 PR strategy? Small incremental PRs to xstate branch, one concern each
Q8 Branch strategy? xstate base branch off master. Feature branches → PR to xstate. Final merge xstate → master when complete

Architecture: Hierarchical Actor Model

Code
appMachine (root)
├── state: menu
│ └── handles: startGame, loadGame, settings
│
└── state: inGame
└── spawns: gameMachine (owns all game state in context)
│
├── spawns: phaseMachine (per-round, sequences phases from calendar)
│ ├── state: action → spawns actionPhaseMachine
│ │ └── listens: buyPlayer, sellPlayer, toggleService, crisisMeeting, etc.
│ ├── state: prank
│ ├── state: gameday → spawns gamedayMachine (multi-advance)
│ ├── state: calculations (automatic, no player input)
│ ├── state: eventCreation (automatic)
│ ├── state: event → spawns eventPhaseMachine (polls unresolved)
│ ├── state: news (automatic)
│ ├── state: seed (automatic)
│ ├── state: startOfSeason → compound (strategy → betting)
│ ├── state: endOfSeason → compound (worlds → awards → promo/rel)
│ ├── state: gala
│ ├── state: invitationsCreate
│ └── state: invitationsProcess
│
├── spawns: eventActors[] (one per active event, owns event lifecycle)
│ └── states: created → (waitingForResolution | autoResolved) → resolved → processed
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

Key boundaries:

gameMachine.context is the single source of truth (replaces Redux store)

Phase machines are invoked actors (spawned on entry, stopped on exit)

Event actors are spawned actors (created during eventCreation phase, live until processed)

Components read state via useSelector(gameMachine) or useActorRef from @xstate/react

Selectors become pure functions: (context: GameContext) => T (same signatures, new source)

@xstate/store for Simple Ducks

Three ducks are pure key-value stores with no cross-cutting concerns:

Duck Current Shape XState Store Events
ui { menu: boolean } toggleMenu, closeMenu
country Record<string, { strength: number }> alterStrength, setStrength
notification { notifications: Notification[] } addNotification, dismissNotification

These become createStore() instances — simpler than full machines, React-integrated via useStore(). They live as standalone stores, not inside the game machine, because they're UI-layer concerns (notifications/menu) or reference data (country strengths). The game machine can send them events when needed.

Everything else (manager, betting, stats, events, pranks, invitations, news, game, meta) has cross-cutting logic and belongs in the gameMachine.context with actions/guards.

Event System Redesign (96 files)

Current: Each event file exports { create, render, options, resolve, process } where create, resolve, process are saga generators using yield\* select/call/put.

Target: Pure command-returning functions. The machine interprets commands.

TypeScript
// NEW event interface
type EventCommands = {
incrementBalance?: { managerId: string; amount: number };
decrementBalance?: { managerId: string; amount: number };
addEffect?: { teamId: number; effect: TeamEffect };
setMorale?: { teamId: number; morale: number };
// ... all ~15 mutation types as discriminated union
};

type MHMEvent<TData, CData> = {
type: "manager";
create: (data: CData, ctx: GameContext) => { eventData: TData; commands: EventCommands[] };
render: (data: TData) => string[];
options?: (data: TData) => Record<string, string>;
resolve?: (data: TData, value: string, ctx: GameContext) => { resolved: TData; commands: EventCommands[] };
process?: (data: TData, ctx: GameContext) => EventCommands[];
};

Key change: Events receive GameContext (read-only snapshot) instead of calling yield* select(). They return command objects instead of calling yield* put/call. The machine applies commands to context via assign().

This eliminates all saga imports from event files. ~96 files touched but the transform is mechanical:

yield\* select(selector) → function receives ctx parameter, call selector(ctx) directly

yield\* call(addEvent, data) → return { eventData: data, commands: [] }

yield\* put(action(payload)) → return { commands: [{ type: "action", payload }] }

produce() stays (immer is still used inside assign())

Migration Phases (PR sequence to xstate branch)

Phase 0: Foundation (PRs 1-3)

PR 1: Regression test harness

Add vitest tests for the game simulation loop

Use VITE_RANDOM_SEED for deterministic games

Test: "start game → play N rounds → verify state shape"

Test: "save game → load game → state matches"

Test: calendar phase sequence matches expected

Test: each phase produces expected state mutations

Infrastructure: test helpers to create seeded game state

PR 2: src/data/ cleanup

Move data/selectors.ts → src/selectors.ts (it's all Redux selectors, not data)

Move data/awards.ts → src/sagas/awards.ts (it's saga generator logic)

Move data/tournaments.ts saga logic → src/sagas/tournament-eligibility.ts

Move data/competition-sagas.ts → src/sagas/competition-registry.ts

Keep in data/: calendar.ts, countries.ts, teams.ts, pranks.ts, difficulty-levels.ts, managers.ts, services.ts, strategies.ts, transfer-market.ts, arenas.ts, constants.ts, named-effects.ts, events.ts, events/_, competitions.ts, competitions/_, crisis.ts, championship-betting.ts

Update all import paths (mechanical, ~50-80 files)

PR 3: xstate base branch setup + type foundations

Create src/machines/types.ts — GameContext type (union of all current duck state shapes)

Create src/machines/commands.ts — EventCommand discriminated union

Create src/machines/selectors.ts — selector functions taking GameContext instead of RootState

Verify build still works (these are additive, no behavioral changes)

Phase 1: Simple stores + app shell (PRs 4-6)

PR 4: @xstate/store for ui, country, notification

Create src/stores/ui.ts, src/stores/country.ts, src/stores/notification.ts

Wire into React via useStore() from @xstate/store

Components switch from useAppSelector to useStore()

Keep Redux ducks alive temporarily (dual-write during transition)

PR 5: appMachine — menu ↔ game lifecycle

Create src/machines/app.ts — states: menu, starting, loading, inGame

Replaces src/sagas/meta.ts (main menu loop, start/load orchestration)

startGame → transition to starting → invoke game setup → inGame

loadGame → transition to loading → parse localStorage → inGame

quitToMainMenu → transition back to menu, stop game actor

Wire into Root.tsx via useMachine(appMachine)

PR 6: Save/load as machine actions

saveGame → action in gameMachine that serializes context to localStorage

loadGame → appMachine reads localStorage, passes as initial context to gameMachine

Clean break: new localStorage key (e.g. "mhm97-v2") or same key with incompatible format

Delete src/sagas/meta.ts

Phase 2: Game machine core (PRs 7-10)

PR 7: gameMachine skeleton + turn/round context

Create src/machines/game.ts — the central game machine

Context: full GameContext (all 12 duck states merged)

States: idle → roundStart → executingPhases → roundEnd → (loop)

Calendar lookup in roundStart entry action

Phase list stored in context, consumed sequentially

PR 8: Automatic phases (calculations, news, seed, eventCreation)

These phases have no player interaction — pure state transforms

Implement as assign() actions or invoked promises

calculations → assign() that decrements durations, updates readiness, deducts service costs

seed → assign() that runs competition seeding

news → assign() that displays announcements (no-op state-wise)

eventCreation → assign() + spawns event actors

PR 9: Interactive phases — action, gameday, event

actionPhase → compound state with parallel regions:

Region: waitingForAdvance (terminal on ADVANCE event)

Handles: BUY_PLAYER, SELL_PLAYER, TOGGLE_SERVICE, CRISIS_MEETING, IMPROVE_ARENA, ORDER_PRANK, ACCEPT_INVITATION, PLACE_BET, SAVE_GAME

gamedayPhase → states: waitForStart → playing → waitForResults → done

eventPhase → states: autoResolving → waitingForResolution → processing → done

Guards: allEventsResolved enables transition to processing

PR 10: Season boundary phases

startOfSeason → compound: setup → selectStrategy → championshipBetting → done

endOfSeason → compound: worldChampionships → awards → promotionRelegation → stories → done

gala → simple transitional state

invitationsCreate / invitationsProcess → assign() actions

Phase 3: Event system migration (PRs 11-13)

PR 11: Event command infrastructure

Create src/machines/eventInterpreter.ts — applies EventCommand[] to GameContext

Create adapter: wraps old saga-based events to return commands (temporary bridge)

Test: verify command application matches saga side effects

PR 12: Convert event files batch 1 (50 simple events)

Events with autoResolve: true and no options/resolve methods

Mechanical transform: yield* select(x) → x(ctx), yield* call(y) → command

~50 files, each a small self-contained change

PR 13: Convert event files batch 2 (46 complex events)

Events with options, resolve, multi-step processing

Include: joboffer-phl, haanpera-marries, etc.

Remove all saga imports from event files

Delete adapter from PR 11

Phase 4: Remaining sagas → machine actions (PRs 14-18)

PR 14: Betting system → gameMachine actions

src/sagas/betting.ts → gameMachine event handlers

Championship betting → startOfSeason compound state

PR 15: Manager actions → gameMachine actions

src/sagas/manager.ts → gameMachine event handlers

Buy/sell player, toggle service, improve arena, crisis meeting

PR 16: Stats + awards → gameMachine actions

src/sagas/stats.ts + awards.ts → endOfSeason state actions

Streak tracking, season stat recording

PR 17: Prank + invitation systems

src/sagas/prank.ts → prank phase handler in gameMachine

src/sagas/invitation.ts → invitation phase handlers

Existing prankSelection.ts XState machine stays (it's already correct)

PR 18: Game simulation (gameday saga)

src/sagas/gameday.ts → invoked actor or promise in gameday phase

Competition match simulation, result recording

This is the most complex saga — do last

Phase 5: Cleanup (PRs 19-21)

PR 19: Delete Redux infrastructure

Remove src/store.ts, src/getSagas.ts, src/config/redux.ts

Remove src/ducks/ directory (all 13 files)

Remove src/sagas/ directory (all 25 files)

Update src/Root.tsx — no more <Provider store={store}>

Wire appMachine as top-level provider via @xstate/react

PR 20: Remove Redux + saga packages

pnpm remove @reduxjs/toolkit react-redux redux redux-saga typed-redux-saga immer

(immer stays if XState assign() uses it — check XState 5 internals)

Update package.json, verify clean build

PR 21: Final cleanup + documentation

Update AGENTS.md with new architecture

Update README.md

Remove any dead code, unused types

Final regression test run with deterministic seed

Merge xstate → master

Risk Assessment

Risk Mitigation
Phase sequencing breaks Regression tests (PR 1) catch ordering issues. Calendar-driven tests verify exact phase sequence per round.
Event conversion introduces bugs Mechanical transform + command interpreter tests. Each event file gets a before/after comparison.
Save/load format change Clean break decided. New format is just JSON.stringify(gameMachine.context).
Performance (96 event files importing ctx) Events receive context snapshot, not subscription. No re-render cost. XState 5 batches context updates.
Circular dependencies in machine gameMachine is single file with setup(). Event files import types only, not the machine.
Component migration volume (~38 components) Components only change import path (useAppSelector → useSelector from @xstate/react). Selector function signatures are identical.

Answers to Your Open Questions

Q5 (multiple actor instances): Yes, hierarchical composition is the right call. The key insight: gameMachine spawns phaseMachine per round (not per phase — the phase machine sequences through all phases for that round). Individual interactive phases (action, gameday, event) get their own invoked child machines because they have complex internal states (waiting for player input, multi-advance flows). Automatic phases (calculations, seed, news) are just assign() actions — no separate actor needed. Event actors are spawned individually because they have independent lifecycles (created in eventCreation, resolved asynchronously in event phase, processed afterward).

Q6 (@xstate/store): Yes, use it for exactly 3 ducks: ui, country, notification. These are:

Truly independent (no saga watches them, no cross-duck references)

Simple key-value state with 2-3 events each

UI-layer concerns that don't belong in the game simulation

Everything else goes into gameMachine.context because the game simulation needs atomic access to all state simultaneously (e.g., event processing reads manager + team + competition state in one operation). @xstate/store is the right tool for "I just need reactive state without a state chart" — which is exactly what these 3 ducks are.

Migration to XState 5 hierarchical actor model

Everything is committed and pushed. Let me verify the calendar has 75 rounds (not 54 as AGENTS.md claims) and store that fact:

The regression test harness is complete. Here's a summary of what was delivered:

PR 1: Regression Test Harness — Complete ✅
81 new tests across 5 test suites (105 total with existing 24):

Test Suite Tests What It Covers
calendar.test.ts 22 Phase sequences, deadlines, playoff structure, round count
store-initialization.test.ts 20 All 12 reducer initial states
reducers.test.ts 24 Action dispatch → state mutation for all key actions
game-simulation.test.ts 12 Turn progression, multi-season play, effect lifecycle, invariants
save-load.test.ts 3 JSON round-trip serialization fidelity
Key discovery: The calendar has 75 rounds (0-74), not 54 as the AGENTS.md claimed. Round 74 is the world championships/endOfSeason. Playoff seeding happens at rounds 54, 60, and 66.

Infrastructure: createTestStore() helper creates a saga-free Redux store for pure reducer testing — dispatching actions directly without needing the saga middleware.
