# AGENTS.md

## Mission

Modernize `mhm-97-remake` to 2026 standards while preserving game behavior.

This is a long-running migration. Prioritize **safe, incremental changes** with clear verification, not large rewrites.

---

## Current Reality (as of 2026-04)

- Runtime / build tool: **Vite** (`pnpm dev`, `pnpm build`)
- UI stack: React 19, React Router 7, styled-components 6
- State stack: Redux 5 + redux-saga + immer (Immutable.js fully removed 2026-04-08)
- Language: **TypeScript only** — zero `.js`/`.jsx` in `src/` as of 2026-04-10
- Lint/format stack: `oxlint` + `oxfmt` (ESLint/Prettier removed)
- Styling stack: styled-components + styled-system + Emotion remnants
- Persistence: localStorage with `JSON.stringify`/`JSON.parse`
- Randomness: single `random-js` instance in `src/services/random.ts`; supports deterministic seeding via `VITE_RANDOM_SEED` env var
- Entry point: `src/client.tsx`
- Root wiring: `src/Root.tsx`
- Store wiring: `src/store.ts`, `src/services/redux.ts`, `src/config/redux.ts`

Recent completed migrations:

- JSX-bearing component files were renamed from `.js` to `.jsx`, then all to `.tsx`
- `react-markdown` deprecated `source` prop migrated to children syntax
- `src/components/Game.tsx` routing updated to modern `<Routes>/<Route element={...}>`
- Added `@` path alias support in Vite + TypeScript config (`@` => `src`) for incremental import migration
- TypeScript checker profile optimized for migration speed: TS/TSX-only include + incremental cache (`.tsbuildinfo`); unused checks handled by `oxlint`
- **Full TypeScript migration complete (2026-04-10):** zero `.js`/`.jsx` files in `src/`
- All sagas use `typed-redux-saga` with `yield*` pattern
- All components converted from class → FC with hooks
- All `connect()` containers eliminated — hooks-only Redux access
- `tsconfig.json` simplified for TypeScript 6 (removed 7 redundant options)
- `.browserslistrc` deleted (Vite 8 doesn't use it)

---

## Migration Status (as of 2026-04-10)

### Completed de-immutable + TypeScript conversions

**Data files:**

- `src/data/countries.ts` — plain `Country` type + `Record<string, Country>`
- `src/data/teams.ts` — plain `TeamDefinition[]` array
- `src/data/pranks.ts` — plain `Record<string, Prank>` + `PrankInstance` type
- `src/data/difficulty-levels.ts` — plain `DifficultyLevel[]` array
- `src/data/named-effects.ts` — plain `Record<string, NamedEffectFn>` (Immutable Map param removed)
- `src/services/effects.ts` — fully typed with plain `Team` + `TeamEffect` (no more Immutable)
- `src/data/managers.ts` — plain `ManagerDefinition[]` array
- `src/data/calendar.ts` — typed `CalendarEntry[]` array with `Seed` type
- `src/data/services.ts` — typed `Record<string, ServiceDefinition>` with effect/price functions
- `src/data/transfer-market.ts` — typed `PlayerType[]` array
- `src/data/strategies.ts` — typed `Strategy[]` array
- `src/data/crisis.ts` — typed crisis data (was already plain, types added)
- `src/data/awards.ts` — typed award/random-event system (was `awards.js` with Immutable `List.of`)
- `src/data/events.ts` — plain `Record<string, any>` event registry (was Immutable `Map`)
- `src/services/random.ts` — typed, deterministic seed support via `VITE_RANDOM_SEED`

**Reducers (ducks):**

- `src/ducks/prank.ts` — plain `{ pranks: PrankInstance[] }` + immer
- `src/ducks/ui.ts` — plain `UiState` + immer + discriminated `UiAction` union
- `src/ducks/event.ts` — immer `produce()`
- `src/ducks/game.ts` — **root is plain `GameState`** + immer; `teams` is typed `Team[]`; `competitions` is typed `Record<string, Competition>`; `managers` is `ManagerDefinition[]`; `flags` is typed `GameFlags`
- `src/ducks/manager.ts` — plain `ManagerState` + immer (`Manager` type with `ManagerArena`, `ManagerServices`)
- `src/ducks/betting.ts` — plain `BettingState` + immer (`ChampionshipBet[]`, `Bet[]`)
- `src/ducks/news.ts` — plain `NewsState` + immer (`string[]` news, `Record<string, string[]>` announcements)
- `src/ducks/notification.ts` — plain `NotificationState` + immer (`Notification[]`, capped at 3)
- `src/ducks/invitation.ts` — plain `InvitationState` + immer (`Invitation[]`)
- `src/ducks/stats.ts` — plain `StatsState` + immer (`SeasonStats[]`, `Streak`, `GameRecord`, `ManagerGameStats`)
- `src/ducks/country.ts` — already plain
- `src/ducks/meta.ts` — plain `MetaState` + immer (`MetaManager` form defaults)

**Other:**

- `src/store.ts`, `src/getSagas.ts` — typed
- lodash fully removed from codebase + `package.json`
- **Immutable.js + transit-immutable-js fully removed** from codebase + `package.json` (2026-04-08)
- Save/load uses `JSON.stringify`/`JSON.parse` (no superjson needed — all state is plain)
- `typed-redux-saga` in use for **all** saga files (full conversion 2026-04-10)

### `GameState` current shape

```ts
type GameFlags = {
  jarko: boolean;
  usa: boolean;
  canada: boolean;
  haanperaMarried: boolean;
  mauto: boolean;
  psycho: number | undefined; // NPC manager array index
};

type GameState = {
  turn: { season: number; round: number; phase: string | undefined }; // PLAIN
  flags: GameFlags; // PLAIN — typed per-flag
  serviceBasePrices: Record<string, number>; // PLAIN
  managers: ManagerDefinition[]; // PLAIN — typed array
  competitions: Record<string, Competition>; // PLAIN — typed with full hierarchy
  teams: Team[]; // PLAIN — typed array indexed by team id
  worldChampionshipResults: WorldChampionshipEntry[] | undefined; // PLAIN — typed array
};
```

### Immutable.js: FULLY REMOVED

As of 2026-04-08, zero `immutable` imports remain in the codebase. The `immutable` and `transit-immutable-js` packages have been removed from `package.json`. All state is plain objects/arrays + immer.

### Completed: `teams` de-immutable

Converted `state.game.teams` from `List<Map<string, any>>` to typed `Team[]`.

**Types defined in `src/ducks/game.ts`:**

```ts
export type TeamEffect = {
  parameter: string[]; // always ["strength"] or ["morale"] in practice
  amount: number | string;
  duration: number;
  extra?: Record<string, unknown>;
};

export type Team = {
  id: number;
  name: string;
  strength: number;
  domestic: boolean;
  morale: number;
  strategy: number;
  readiness: number;
  effects: TeamEffect[];
  opponentEffects: TeamEffect[];
  manager?: string;
};
```

**Scope:** ~16 reducer cases, selectors, ~76 event files, ~12 component files, ~6 saga files, ~4 competition data files, effects.ts, named-effects.ts, game service, awards, crisis, championship-betting.

### Gotchas learned from teams migration

- **sed + nested `.get()` = bracket chaos:** `sed 's/teams\.get(\(.*\))/teams[\1]/g'` breaks when the argument itself contains `.get("...")` — it eats the closing paren. Use more targeted patterns or manual fixes for nested cases.
- **`perl -pi -e` multiline `.get(\n"name"\n)` patterns** are fragile — better to fix multiline cases manually rather than risk broken template literals.
- **`foreignTeams` selector returns `Team[]` now** — tournament seed code wraps it in `List()` at the boundary where it enters Immutable-land.
- **Effect parameters are always single-element arrays** (`["strength"]`, `["morale"]`) — no deep paths exist in practice.
- **`pekkalandianTeams` uses `.slice(0, 24)` not `.take(24)`** — native array equivalent.

### Proven migration technique

For bulk consumer updates, use `sed` for single-line patterns and `perl -0777` for multiline patterns. This handled 162 call sites in minutes during the game reducer root migration.

### Completed: `competitions` de-immutable

Converted `state.game.competitions` from deeply nested `OrderedMap(Map(Map(...)))` to typed `Record<string, Competition>`.

**Types defined in `src/types/competitions.ts`:**

Full type hierarchy: `GameResult`, `Pairing`, `TeamStat`, `MatchupStat`, `MatchupTeamStat`, `Penalty`, `RoundRobinGroup`, `TournamentGroup`, `PlayoffGroup`, `Group`, `Phase`, `Competition`, `GamedayAdvantage`, `GamedayParams`, `CompetitionParameters`, `GameFacts`, `CompetitionDefinition`.

**Scope of changes (~35 files):**

- Types: `src/types/competitions.ts`
- Services: `league.ts`, `playoffs.ts`, `game.ts`, `competition-type.ts`, `tournament.ts`
- Competition definitions: `phl.ts`, `division.ts`, `ehl.ts`, `competitions/tournaments.ts`
- Top-level: `competitions.ts`, `tournaments.ts`
- Reducer: All 9 competition cases in `game.ts`
- Selectors: `data/selectors.ts` (~12 sites)
- Sagas: `gameday.js`, `stats.js`, `sagas/game.js`, `betting.js`, `manager.js`, `invitation.js`, `phase/gala.js`, `phase/end-of-season.ts`
- Data: `crisis.js`, `awards.js`, `championship-betting.js`, `events/joboffer-phl.ts`
- Components: `Gameday.jsx`, `GamedayResults.jsx`, `Pranks.jsx`, `ChampionshipBetting.jsx`, `DeveloperMenu.jsx`, `LeagueTables.jsx`, `ActionMenu.jsx`, `Invitations.jsx`, `Stats.jsx`, `CrisisActions.jsx`
- Sub-components: `gameday/Games.jsx`, `gameday/Results.jsx`, `gameday/Game.jsx`, `league-table/Table.jsx`, `playoffs/Matchups.jsx`, `betting/BettingForm.jsx`, `championship-betting/BettingForm.jsx`, `context-sensitive/Forward.jsx`, `context-sensitive/Situation.jsx`, `pranks/SelectVictim.jsx`, `stats/ManagerStats.jsx`, `stats/Story.jsx`
- Containers: `BettingContainer.js`

### Gotchas learned from competitions migration

- **`Group` union type causes `.id` unavailable:** `TeamStat | MatchupStat` union means `.id` doesn't exist on `MatchupStat`. Fix: cast to `TeamStat[]` when accessing round-robin group stats (`as TeamStat[]`).
- **`victors()` expects `PlayoffGroup`:** The `Group` union doesn't narrow automatically. Cast to `PlayoffGroup` at call sites.
- **`roundRobin()` vs `scheduler()`:** `roundRobin(n)` returns raw `number[][][]` (1 arg). `scheduler(n, times)` returns `Pairing[][]` (2 args). Competition seed files needed `scheduler`, not `roundRobin`.
- **`GeneratorFunction` type is strict:** TypeScript's builtin `GeneratorFunction` requires `[Symbol.toStringTag]`. Use `(...args: any[]) => Generator<any, any, any>` for saga generator types in `CompetitionDefinition`.
- **Immutable `.first()/.last()` → `[0]/[length-1]`:** Not a complex pattern but very common across UI components.
- **`competitionTypes` was a nested `Map(Map(...))`:** Now `Record<string, CompetitionType>`. Access changed from `.getIn([type, "playMatch"])` to `[type].playMatch`.
- **`pairing.includes(index)` → `pairing.home === index || pairing.away === index`:** Immutable Maps had `.includes()` which checked values; plain objects need explicit field checks.
- **`odds()` returned Immutable Map, now returns plain array:** Consumer code changed from `.getIn([id, "odds"])` to `.find(t => t.id === id)?.odds`.
- **Old `.js` files survive alongside `.ts`:** Vite prefers `.ts` but the dead `.js` files cause confusing grep results. Always delete old files after conversion.
- **`crisis()` returned `Map({...})`:** Consumers used `.get("amount")`. Converted to return plain object, consumers use `.amount`.

### Completed: `managers` de-immutable

Converted both `state.game.managers` (NPC list) and `state.manager` (player manager duck) from Immutable to typed plain objects.

**Types defined in `src/ducks/manager.ts`:**

```ts
export type ManagerArena = { level: number; name: string };
export type ManagerServices = Record<string, boolean>;
export type Manager = {
  id: string;
  name: string;
  team?: number;
  difficulty: number;
  pranksExecuted: number;
  services: ManagerServices;
  balance: number;
  arena: ManagerArena;
  extra: number;
  insuranceExtra: number;
  flags: Record<string, boolean>;
};
export type ManagerState = {
  active: string | undefined;
  managers: Record<string, Manager>;
};
```

**`GameFlags` typed in `src/ducks/game.ts`** — discriminated per-flag: `jarko`, `usa`, `canada`, `haanperaMarried`, `mauto` are `boolean`; `psycho` is `number | undefined` (NPC manager array index). Type-safe `flag()` selector generic over `keyof GameFlags`.

**Scope:** ~25 containers, ~20 components, ~22 event files, ~12 saga files, 3 competition data files, selectors, game service.

### Gotchas learned from managers migration

- **`services.getIn([k, "effect"])` stays Immutable:** ~~`data/services.js` hasn't been migrated yet.~~ Now migrated to `data/services.ts`. Manager's `.services` is plain and service definitions are plain.
- **Competition `gameBalance` callbacks receive manager:** `phl.ts`, `division.ts`, `ehl.ts` all had `manager.getIn(["arena", "level"])` and `manager.get("extra")` — easy to miss.
- **`gameday.js` constructs game facts:** `homeManager.get("id")` / `awayManager.get("id")` in the result object — runtime error, not caught by typecheck.
- **Rally events passed `Map({ rallyMorale: ... })` as effect extra:** Named effects then read `extra.rallyMorale` which returns `undefined` on an Immutable Map. Caused `RangeError: Expected max to be at most 9007199254740992` in game simulation. Fix: pass plain object.
- **`Situation.jsx` wrapped manager in `List.of(manager)`:** Needed `{ [manager.id]: manager }` to match `Record<string, Manager>` shape.
- **Redux DevTools serialize Immutable transparently:** You can't tell from DevTools whether a value is `Map({x: 1})` or `{x: 1}` — both display identically. This makes boundary bugs invisible in DevTools.
- **`flag("psycho")` stores a number (NPC manager index), not boolean:** Required widening `GameFlags` from `Record<string, boolean>` to per-flag typed union.

### Completed: `calendar` de-immutable

Converted `src/data/calendar.js` from Immutable `List<Map>` to typed `CalendarEntry[]`.

**Types defined in `src/data/calendar.ts`:**

```ts
type Seed = { competition: string; phase: number };
export type CalendarEntry = {
  phases: string[];
  gamedays: string[];
  seed: Seed[];
  title?: string;
  round: number;
  transferMarket: boolean;
  crisisMeeting: boolean;
  createRandomEvent: boolean;
  pranks: boolean;
};
```

**Scope:** 4 sagas, 5 components (+ Calendar UI component with `when=` callbacks).

### Gotchas learned from calendar migration

- **`Calendar` component's `when` callback receives `(entry, fullCalendar, state)`:** `Current.jsx` accesses `c[turn.round + 1]` (next turn) in addition to the current entry.
- **`seed.js` saga used `.getIn([round, "seed"], List())`:** Now `calendar[round].seed` with default `[]` in the type.
- **75 entries verified:** Entry count matched between old Immutable chain-built list and new plain array.

### Completed: `stats` de-immutable

Converted `state.stats` from deeply nested Immutable `Map(List(Map(...)))` to typed `StatsState` with immer.

**Types defined in `src/ducks/stats.ts`:**

```ts
export type Streak = {
  win: number;
  draw: number;
  loss: number;
  noLoss: number;
  noWin: number;
};
export type GameRecord = { win: number; draw: number; loss: number };
export type ManagerGameStats = {
  games: Record<string, Record<string, GameRecord>>;
};
export type SeasonStats = {
  ehlChampion: number | undefined;
  presidentsTrophy: number | undefined;
  medalists: number[] | undefined;
  worldChampionships: any[] | undefined;
  promoted: number | undefined;
  relegated: number | undefined;
  stories: Record<string, any>;
  managers: Record<string, any>;
};
export type StatsState = {
  managers: Record<string, ManagerGameStats>;
  currentSeason: SeasonStats | undefined;
  seasons: SeasonStats[];
  stories: Record<string, any>;
  streaks: {
    team: Record<string, Record<string, Streak>>;
    manager: Record<string, any>;
  };
};
```

**Scope (~12 files):**

- Reducer: `src/ducks/stats.ts` (5 cases: META_QUIT, META_LOAD, SEASON_START, SEASON_END, STATS_SET_SEASON_STAT, STATS_UPDATE_FROM_FACTS)
- Sagas: `sagas/stats.js`, `sagas/betting.js`
- Competition data: `data/competitions/ehl.ts`
- Selectors: `data/selectors.ts`
- Components: `stats/TeamStats.tsx`, `stats/ManagerStats.jsx`, `stats/Story.jsx`, `stats/Achievements.jsx`, `Streaks.jsx`
- Containers: `containers/StreaksContainer.js`

### Gotchas learned from stats migration

- **`Achievements.jsx` had a bug in original Immutable code:** `medals` Map had duplicate key `0` (`[0, "kulta"], [1, "hopea"], [0, "pronssi"]`). Immutable's last-write-wins meant medal 0 was "pronssi" (wrong). Fixed to plain object with correct keys `{0: "kulta", 1: "hopea", 2: "pronssi"}`.
- **`Streaks.jsx` Immutable `.filter().count().map().toList()` chain:** Converted to `Object.entries().filter().map()` — much simpler.
- **`ManagerStats.jsx` used `stat.reduce((r, s) => r + s, 0)` to sum Immutable Map values:** Plain object equivalent is just `stat.win + stat.draw + stat.loss`.
- **`ehl.ts` had `ehlTeams.toArray ? ehlTeams.toArray() : ehlTeams` guard:** This was a boundary workaround for Immutable→array conversion. Now unnecessary — removed.
- **`.reverse()` → `.toReversed()` in components:** Used non-mutating array method per codebase convention.

### Pre-existing issues (not migration-related)

- `Root.tsx` has 2 TS errors about `DefaultTheme.colors` — styled-components theme typing gap
- CSS `:global` pseudo-class warnings from lightningcss (legacy `.pcss` file)

### Completed: Full saga TypeScript migration (2026-04-10)

Converted all 13 saga files + 13 phase files from `redux-saga/effects` to `typed-redux-saga` with full TypeScript typing.

**Saga files converted:** `betting.ts`, `notification.ts`, `news.ts`, `manager.ts`, `event.ts`, `meta.ts`, `invitation.ts`, `stats.ts`, `team.ts`, `prank.ts`, `gameday.ts`, `game.ts`

**Phase files converted:** `action.ts`, `event.ts`, `event-creation.ts`, `seed.ts`, `news.ts`, `prank.ts`, `calculations.ts`, `gala.ts`, `start-of-season.ts`, `end-of-season.ts`, `invitations-process.ts`, `invitations-create.ts`, `gameday.ts`

### Gotchas learned from saga migration

- **`typed-redux-saga` + `takeEvery` with string patterns:** No clean overload for raw action type strings. Requires `as any` cast: `takeEvery("ACTION_TYPE" as any, handler)`. Resolves naturally with RTK `createSlice` action creators.
- **`race()` result typing:** `race({ bet: take(X), advance: take(Y) })` returns `{ bet: Action | undefined, advance: Action | undefined }` — `Action` has no `.payload`. Cast to `any` at access site or type the action explicitly.
- **`yield*` vs `yield`:** Every `redux-saga/effects` call must become `yield*` with `typed-redux-saga`. Missing the `*` compiles but gives `any` return types — the whole point of the migration is lost.
- **`arena.get("level")` — Immutable ghost in `game.js`:** Survived the Immutable removal, would crash at runtime when insurance was active. Found and fixed during TS conversion to `arena!.level`.
- **`ehlChampionship` vs `ehlChampion` — property name mismatch:** Caught by typing `stats.ts`. `setSeasonStat(["ehlChampionship"], ...)` wrote to wrong key. Real bug, not just a type error.
- **Team id `string` vs `number` pipeline:** HTML form values are strings, which propagated through event data files as `string` team ids. Fixed 8+ event files + the full prank `victim` pipeline (6 files) to use `number` consistently.
- **`protest.ts` had live Immutable ghosts:** `.filterNot()`, `.get()`, `.getIn()` in the `process` function would crash at runtime. Fixed to plain `Object.entries()`/property access.
- **`Error` constructor only takes one string arg:** `new Error("msg", extraArg1, extraArg2)` silently drops extra args. Fixed to template literal.
- **Inline saga functions in `takeEvery`/`all`:** `action.ts` uses inline `function*` inside `takeEvery(CONSTANT, function* (action) {...})` — these need `action: any` typing since typed-redux-saga can't infer the payload shape from string constants.
- **`Generator` return types matter for `yield* call()`:** `tournaments.ts` `isInvited` needed `Generator<any, boolean, any>` (second type param is return type) for callers to get `boolean` instead of `any`.

---

## Non-Negotiables for Agents

1. **KISS: Keep It Simple, Stupid**
   - Always prefer the simpler solution when possible.
   - Simple does not mean easy — a well-designed simple solution often requires more thought than a complex one.
   - Avoid over-engineering, unnecessary abstractions, and premature generalization.

2. **Vite-first only**
   - Do not reintroduce Webpack config, plugins, or assumptions.
   - If legacy webpack references remain in deps/config, treat them as cleanup candidates.

3. **Behavior preservation over stylistic churn**
   - The game simulation logic is sensitive (calendar/event/phase sequencing).
   - Avoid refactors that alter ordering, immutability semantics, or saga control flow unless explicitly required.

4. **Small PR-sized changes**
   - One concern per change set (e.g., router fixes, markdown API, one saga area, one reducer area).
   - Keep diffs reviewable.

5. **No new legacy patterns**
   - Do not add new class components unless absolutely required.
   - Do not reintroduce Immutable.js — it has been fully removed.
   - Prefer named exports; avoid default exports for new/edited modules unless interop absolutely requires it.
   - **Prefer non-mutating array methods:** use `toSorted()` over `[...arr].sort()` or `arr.sort()`, `toReversed()` over `reverse()`, `toSpliced()` over `splice()`, and `with()` over index assignment. Avoid in-place mutation even on freshly created arrays — consistency matters more than micro-optimization.

6. **Page/leaf component boundary**
   - **Page components** (route-level screens that assemble a view) may use `useAppSelector`/`useAppDispatch` and talk to the Redux store directly.
   - **Leaf components** (render UI, handle interaction) must stay store-agnostic: data in via props, user intent out via callback props. No `useAppSelector`, no `useAppDispatch`, no action creator imports.
   - This is the same presentational/container split from the `connect()` era, now enforced by discipline instead of file boundaries. Hooks make coupling frictionless — stay vigilant.

7. **Type safety must trend upward**
   - New/edited modules should be TypeScript where feasible.
   - Add lightweight types around action payloads/selectors touched by a change.
   - Prefer `type` aliases by default; use `interface` only when declaration merging/extension semantics are explicitly needed.
   - For React components, prefer the `FC<Props>` typing style where practical and readable.
   - `type-fest` is installed (devDep) — use it freely for utility types (`Simplify`, `PartialDeep`, `SetRequired`, `Opaque`, etc.) instead of reinventing them.
   - `remeda` is installed — prefer native JS first, then `remeda` for TS-friendly utility composition in new/edited modules (do not reintroduce `ramda`).

---

## Collaboration Style Preferences

- Be direct and honest. Do not sugarcoat or be performatively polite.
- Be respectful and non-malicious: treat others as you’d like to be treated.
- Say what you really think when giving technical feedback.
- Liberal use of coding humor is appreciated.
- For test/mock data examples, `Pier Paolo Pasolini` is a preferred recurring subject.

---

## Modernization Priorities

### P0 — Toolchain and runtime stability

- Keep dev/build working with Vite and Node 24 (`.nvmrc` => `v24`).
- TypeScript config is simplified for TS 6; `verbatimModuleSyntax` is enabled and `allowJs` can now be removed if desired.
- Remove dead webpack-era leftovers after confirming unused:
  - webpack-related dependencies
  - legacy core-js upgrade plugin wiring (`src/config/corejs-upgrade.js`)
  - stale docs/instructions referencing old scripts
- Ensure README reflects **pnpm + Vite** (not old yarn start flow).

### P1 — API compatibility and broken-upgrade fallout

- Continue modern React/Router API migrations where old patterns remain.
- Keep `react-markdown` usage aligned with v10+ API.
- Audit other upgraded libs for silent breaks (notably routing, UI animation libs, and deprecated props).

### P2 — TypeScript + Immutable → immer + native: ✅ COMPLETE

**Immutable.js fully removed 2026-04-08.** All reducers, data files, selectors, components, and sagas use plain objects/arrays + immer. `immutable` and `transit-immutable-js` removed from dependencies. Save/load uses `JSON.stringify`/`JSON.parse`.

### P2.5 — TypeScript migration: ✅ COMPLETE

**As of 2026-04-10, zero `.js`/`.jsx` files remain in `src/`.** Full conversion timeline:

- **2026-04-08:** Immutable.js fully removed, all ducks/data files converted
- **2026-04-09:** All 33 components converted to `.tsx`, all containers eliminated (`connect()` → hooks), all page components hookified
- **2026-04-10:** All sagas converted to TypeScript with `typed-redux-saga`, `tsconfig.json` simplified for TS 6, `.browserslistrc` removed

Key conventions established during migration:

- `typed-redux-saga` with `yield*` (not bare `yield`) for all saga effects
- `RootState` from `src/config/redux.ts` in all `select()` calls
- `as const` on action type strings in `put()` calls
- `as any` cast on `takeEvery` string pattern args (typed-redux-saga limitation until RTK action creators)
- `TeamStat`/`PlayoffGroup` casts needed when accessing `Group` union stats
- Shared domain types in `src/types/` (competitions, base events)

### P3 — State architecture evolution (controlled)

- **Short term:** Build regression test suite (deterministic seed support is ready via `VITE_RANDOM_SEED`).
- **Mid term:** Evaluate selective Redux + Saga → RTK/RTK Query slices, but only for new async flows, not core game logic.
- **Long term:** XState is the only realistic architectural upgrade for the game engine itself (phase/turn loop is a textbook state machine). But this is a full engine rewrite — only viable after a regression suite exists. TS migration prerequisite is now met. Do not attempt piecemeal.

### P4 — Styling: styled-components/Emotion/styled-system → Vanilla Extract

- Current stack: styled-components 6 + styled-system 5 + Emotion remnants
- Target: **Vanilla Extract** — zero runtime, TypeScript-native `.css.ts` files, first-class Vite support
- **Sprinkles** replaces styled-system's `space`/`color`/`width` utility props with typed, static equivalents
- Eliminates the `DefaultTheme` declaration merging pain (e.g. the pre-existing `Root.tsx` errors)
- Migration path: one component at a time
- **P2.5 is complete** — styling migration is now unblocked
- Interim: use `shouldForwardProp` on typed styled-components to prevent custom props leaking to the DOM (see `Button.ts` pattern)

### Saga TypeScript strategy

`typed-redux-saga` is installed. All saga files use the typed wrappers instead of bare `redux-saga/effects`. This gives proper return type inference for `yield call()` without any architectural change.

```ts
// All saga files use:
import { call, put, take } from "typed-redux-saga";
// with yield* instead of yield
```

Do not use `typed-redux-saga/macro` — it requires a Babel transform and this project uses Vite (no Babel).

---

## High-Risk Areas (Handle Carefully)

- `src/sagas/**` phase sequencing and cancellation logic
- `src/ducks/**` reducer state shapes (now plain objects + immer)
- event generation and calendar-dependent flows (`src/sagas/phase/**`, `src/data/calendar.ts`, `src/data/events.ts`)
- save/load serialization (`JSON.stringify`/`JSON.parse` in `src/sagas/meta.ts`)

When touching these areas:

- keep action names stable unless migration requires otherwise
- preserve reducer shape and key paths
- explicitly verify save/load still works

---

## Working Rules for Future Agents

### Before coding

- Read the affected file(s) fully.
- Find neighboring usage sites before changing signatures.
- Verify whether code is legacy/unused before deleting.

### During coding

- **Never use `npx`.** Use `pnpm run <script>` or `pnpm exec <binary>` instead.
- Prefer extensionless imports unless build requires explicit extension.
- Match existing style in each file; do not run mass formatting unrelated to task.
- Keep user-visible strings/language unchanged unless requested.

### After coding

- Run the narrowest useful verification first, then broader checks.
- Confirm no leftover deprecated API patterns from the migrated concern.

### Maintain AGENTS.md as a living document

- Every time you discover something new or interesting, update AGENTS.md:
  - New patterns or gotchas in high-risk areas
  - Revised understanding of system constraints
  - Lessons from a migration (what worked, what didn't)
  - Blocking issues or dependencies that affect prioritization
  - Successful techniques that should be reused
- Keep entries concise and actionable, not verbose.
- This document evolves with the codebase—treat it as shared institutional memory.

---

## Verification Checklist

Because scripts are minimal, use practical checks:

1. `pnpm dev` starts and renders without immediate crashes.
2. `pnpm build` succeeds.
3. For TypeScript-touched changes, run `pnpm run typecheck --noEmit` (or `pnpm exec tsc --noEmit`).
4. For API migrations, grep for old patterns to ensure full removal.

If one check is known-broken for unrelated reasons, state that explicitly and still run all applicable checks.

---

## Immediate Backlog Suggestions

1. Update `README.md` to current install/run commands (`pnpm` + `vite`).
2. Inventory and remove webpack-only dependencies/config that are now dead.
3. Vitest is configured (`vitest.config.ts`, `@vitest/ui` installed, Jest fully removed); add scripts for lint/typecheck/test so modernization has consistent gates.
4. Add a small regression suite around:
   - game start/load/save (now plain JSON — easy to snapshot)
   - one full turn phase progression (use `VITE_RANDOM_SEED` for determinism)
   - event creation sanity
5. Playwright e2e tests using deterministic seed (`VITE_RANDOM_SEED=X pnpm dev`) — same seed + same clicks = same game.
6. ~~Continue TypeScript migration of remaining `.js`/`.jsx` files.~~ ✅ Done.
7. Audit stale peer dependency warnings (react-pose, react-toggle, react-typography, react-helmet all have React 19 peer issues).
8. Tighten `tsconfig.json`: remove `allowJs` (no JS left), consider enabling `noImplicitAny` incrementally.
9. Clean up `any` casts introduced during saga migration (`takeEvery` string patterns, `race` result payloads) — these become unnecessary once action creators exist.
10. Fix the `Root.tsx` `DefaultTheme` typing gap (precursor to P4 Vanilla Extract migration).
11. Remove `@redux-saga/delay-p` from dependencies (sole consumer was `notification.js`, now uses `typed-redux-saga`'s `delay`).

---

## Decision Heuristics

When unsure, prefer:

- explicitness over magic
- typed boundaries over implicit `any`
- isolated migrations over broad rewrites
- proven behavior over architectural purity

The objective is to ship a stable modern codebase, not to “rewrite everything at once.”
