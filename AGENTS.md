# AGENTS.md

## Mission

Modernize `mhm-97-remake` to 2026 standards while preserving game behavior.

This is a long-running migration. Prioritize **safe, incremental changes** with clear verification, not large rewrites.

---

## Current Reality (as of 2026-04)

- Runtime / build tool: **Vite** (`pnpm dev`, `pnpm build`)
- UI stack: React 19, React Router 7, styled-components 6
- State stack: Redux 5 + redux-saga + Immutable.js
- Language mix: TypeScript + JavaScript + JSX (partial TS migration)
- Lint/format stack: `oxlint` + `oxfmt` (ESLint/Prettier removed)
- Styling stack: styled-components + styled-system + Emotion remnants
- Persistence: localStorage with `transit-immutable-js`
- Entry point: `src/client.tsx`
- Root wiring: `src/Root.tsx`
- Store wiring: `src/store.js`, `src/services/redux.ts`, `src/config/redux.ts`

Recent completed migrations:

- JSX-bearing component files were renamed from `.js` to `.jsx`
- `react-markdown` deprecated `source` prop migrated to children syntax
- `src/components/Game.jsx` routing updated to modern `<Routes>/<Route element={...}>`
- Added `@` path alias support in Vite + TypeScript config (`@` => `src`) for incremental import migration
- TypeScript checker profile optimized for migration speed: TS/TSX-only include + incremental cache (`.tsbuildinfo`); unused checks handled by `oxlint`

---

## Migration Status (as of 2026-04-06)

### Completed de-immutable + TypeScript conversions

**Data files:**

- `src/data/countries.ts` — plain `Country` type + `Record<string, Country>`
- `src/data/teams.ts` — plain `TeamDefinition[]` array
- `src/data/pranks.ts` — plain `Record<string, Prank>` + `PrankInstance` type
- `src/data/difficulty-levels.ts` — plain `DifficultyLevel[]` array
- `src/data/named-effects.ts` — plain `Record<string, NamedEffectFn>` (Immutable Map param removed)
- `src/services/effects.ts` — fully typed with plain `Team` + `TeamEffect` (no more Immutable)
- `src/services/round-robin.ts` — native arrays, 17 vitest tests
- `src/services/tournament.ts` — typed, wraps `roundRobin()` in Immutable (band-aid until competitions de-immutable)

**Reducers (ducks):**

- `src/ducks/prank.ts` — plain `{ pranks: PrankInstance[] }` + immer
- `src/ducks/ui.ts` — plain `UiState` + immer + discriminated `UiAction` union
- `src/ducks/event.ts` — immer `produce()`
- `src/ducks/game.ts` — **root is plain `GameState`** + immer; `teams` is typed `Team[]`; `competitions` is typed `Record<string, Competition>`; `managers` still Immutable
- `src/ducks/country.ts` — already plain
- `src/ducks/meta.ts` — typed

**Other:**

- `src/store.ts`, `src/getSagas.ts` — typed
- lodash fully removed from codebase + `package.json`
- `typed-redux-saga` in use for all converted saga files

### `GameState` current shape

```ts
type GameState = {
  turn: { season: number; round: number; phase: string | undefined }; // PLAIN
  flags: Record<string, boolean>; // PLAIN
  serviceBasePrices: Record<string, number>; // PLAIN
  managers: any; // still Immutable
  competitions: Record<string, Competition>; // PLAIN — typed with full hierarchy
  teams: Team[]; // PLAIN — typed array indexed by team id
  worldChampionshipResults: any; // still Immutable (List of Maps)
};
```

### Still Immutable (known remaining)

- `state.game.managers` — Immutable (shared with manager duck)
- `state.game.worldChampionshipResults` — Immutable `List(Map(...))`
- `state.manager` — full Immutable duck
- `state.stats` — full Immutable duck
- `state.betting`, `state.news`, `state.notification`, `state.invitation` — Immutable ducks
- `src/data/events/*.ts` — event registry uses Immutable Map
- `src/data/calendar.js` — Immutable List
- `src/data/services.js` — Immutable OrderedMap/Map
- `src/data/transfer-market.js` — likely Immutable
- `src/data/arenas.js`, `src/data/strategies.js` — likely Immutable

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

### Pre-existing issues (not migration-related)

- `Root.tsx` has 2 TS errors about `DefaultTheme.colors` — styled-components theme typing gap
- CSS `:global` pseudo-class warnings from lightningcss (legacy `.pcss` file)

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
   - Do not add new Immutable-heavy APIs in fresh code; prefer typed plain objects for new modules.
   - Prefer named exports; avoid default exports for new/edited modules unless interop absolutely requires it.
   - **Prefer non-mutating array methods:** use `toSorted()` over `[...arr].sort()` or `arr.sort()`, `toReversed()` over `reverse()`, `toSpliced()` over `splice()`, and `with()` over index assignment. Avoid in-place mutation even on freshly created arrays — consistency matters more than micro-optimization.

6. **Type safety must trend upward**
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
- Keep TypeScript config migration-friendly during mixed JS/TS phase; avoid `verbatimModuleSyntax` until import hygiene is consistently type-only across the codebase.
- Remove dead webpack-era leftovers after confirming unused:
  - webpack-related dependencies
  - legacy core-js upgrade plugin wiring (`src/config/corejs-upgrade.js`)
  - stale docs/instructions referencing old scripts
- Ensure README reflects **pnpm + Vite** (not old yarn start flow).

### P1 — API compatibility and broken-upgrade fallout

- Continue modern React/Router API migrations where old patterns remain.
- Keep `react-markdown` usage aligned with v10+ API.
- Audit other upgraded libs for silent breaks (notably routing, UI animation libs, and deprecated props).

### P2 — TypeScript + Immutable → immer + native (unified migration)

**Rationale:** Immutable.js typing is fundamentally broken (nested Maps with functions require `as any` at boundaries). Rather than type Immutable then replace it, do both simultaneously. This yields:

- Type safety immediately (immer types well, natives are simple)
- Cleaner, more ergonomic code
- Faster migration velocity (no waste on Immutable typing)

**Sequencing:**

1. Pick a file (start with small services, then leaf reducers, work inward)
2. Convert to TypeScript with native data structures + immer
3. Test manually (user is regression suite for now)
4. Move to next file
5. Build formal regression suite if drift is detected

**Specifics:**

- Each file: replace Immutable.js Map/List with native objects/arrays, add immer for any mutations
- Shared domain types in `src/types/` as they emerge
- Keep a shared `RootState` seed in Redux setup (`src/config/redux.ts`) and consume it in containers/selectors instead of local `any` state types
- Use `produce()` from immer instead of `.update()` / `.setIn()` chains

### P3 — State architecture evolution (controlled)

- **Short term (concurrent with P2):** Stabilize existing Redux + Saga + Immutable flows via TS typing and regression suite.
  - **⚠️ Immutable.js typing is broken:** Nested Maps with function properties require `as any` at boundaries. This defeats type safety and makes refactoring risky. Do not waste cycles perfecting Immutable types—accept pragmatic `as any` boundary casts and prioritize the immer migration.
- **Mid term (after P2 regression suite passes):** Migrate to immer + native data structures + superjson:
  - Start with leaf reducers (low dependency footprint)
  - Work inward toward core state shape
  - Use regression suite to verify save/load round-trips, phase sequencing, event generation remain identical
  - Fork's version mismatch was the only custom logic; superjson handles standard serialization
- **Long term:** Evaluate selective Redux + Saga → RTK/RTK Query slices, but only for new async flows, not core game logic.
- **Very long term:** XState is the only realistic architectural upgrade for the game engine itself (phase/turn loop is a textbook state machine). But this is a full engine rewrite — only viable after the TS migration is complete and a regression suite exists. Do not attempt piecemeal.

### Saga TypeScript strategy

`typed-redux-saga` is installed. When migrating saga files to TypeScript, use the typed wrappers instead of bare `redux-saga/effects`. This gives proper return type inference for `yield call()` without any architectural change.

```ts
// Instead of:
import { call, put, take } from "redux-saga/effects";

// Use:
import { call, put, take } from "typed-redux-saga";
```

Do not use `typed-redux-saga/macro` — it requires a Babel transform and this project uses Vite (no Babel).

---

## High-Risk Areas (Handle Carefully)

- `src/sagas/**` phase sequencing and cancellation logic
- `src/ducks/**` reducers using deep Immutable updates
- event generation and calendar-dependent flows (`src/sagas/phase/**`, `src/data/calendar.js`, `src/data/events*`)
- save/load serialization boundaries (`transit-immutable-js` in meta sagas)

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
   I4. Add a small regression suite around:
   - game start/load/save
   - one full turn phase progression
   - event creation sanity

---

## Decision Heuristics

When unsure, prefer:

- explicitness over magic
- typed boundaries over implicit `any`
- isolated migrations over broad rewrites
- proven behavior over architectural purity

The objective is to ship a stable modern codebase, not to “rewrite everything at once.”
