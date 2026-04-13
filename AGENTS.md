# AGENTS.md

## Mission

Modernize `mhm-97-remake` to 2026 standards while preserving game behavior.

This is a long-running migration. Prioritize **safe, incremental changes** with clear verification, not large rewrites.

> **Important:** Also read [`XSTATE-REFACTORING.md`](XSTATE-REFACTORING.md) — the full XState migration plan with locked architectural decisions, PR sequence, and risk assessment.

---

## Current Reality (as of 2026-04-13)

- Runtime / build tool: **Vite 8** (`pnpm dev`, `pnpm build`)
- UI stack: React 19, React Router 7
- State stack: Redux 5 + **RTK `createReducer`** + redux-saga + XState 5 + **`@xstate/store`** (ui, country, notification) + **`appMachine`** (menu ↔ game lifecycle) (Immutable.js fully removed 2026-04-08)
- Language: **TypeScript only** — zero `.js`/`.jsx` in `src/` as of 2026-04-10
- Lint/format stack: `oxlint` + `oxfmt` (ESLint/Prettier removed)
- Styling stack: **Vanilla Extract** (zero-runtime CSS-in-TS) + **sprinkles** for utility props
- Forms: **react-hook-form** + **zod** + `@hookform/resolvers`
- Icons: **react-icons** (FA solid subset)
- Persistence: localStorage with `JSON.stringify`/`JSON.parse`
- Randomness: **`RandomService`** type in `src/services/random.ts` with `createRandom(seed)` factory for testable DI; app-wide singleton as default export; supports deterministic seeding via `VITE_RANDOM_SEED` env var
- Build extras: React Compiler via `@rolldown/plugin-babel` + `babel-plugin-react-compiler`
- Entry point: `src/client.tsx`
- Root wiring: `src/Root.tsx`
- Store wiring: `src/store.ts`, `src/config/redux.ts`
- Import convention: all `../` relative imports normalized to `@/` alias paths (`@/*` → `./src/*`)
- Selectors: `src/selectors.ts` (moved from `data/selectors.ts` — Redux selectors, not data)
- Game definitions: `src/game/events/` (96 event files), `src/game/events.ts` (registry), `src/game/pranks.ts`
- Awards saga: `src/sagas/awards.ts` (moved from `data/awards.ts`)
- Tournament eligibility: `src/sagas/tournament-eligibility.ts` (extracted from `data/tournaments.ts`)
- Competition saga registry: `src/sagas/competition-registry.ts` (moved from `data/competition-sagas.ts`)
- `src/data/` now contains **only pure data** — zero `typed-redux-saga` imports
- **Regression tests:** 105 vitest tests (81 new across 5 suites + 24 existing)
- **TypeScript check: ZERO errors** (as of 2026-04-12)
- Dev tooling: **Stately Inspector** (`@statelyai/inspect`) for XState store visualization (dev-only, tree-shaken in prod)
- **Bundle: 674.25kB JS (gzip 215kB), 7.08kB CSS (gzip 1.94kB)** — down from ~806kB JS + runtime CSS

Recent completed migrations (2026-04-12):

- **Vanilla Extract migration complete:** all 27+ styled-components converted to VE `.css.ts` files
- **styled-components + styled-system + Emotion fully removed** from codebase + `package.json`
- **PostCSS fully removed:** 4 plugins + config removed, `style.pcss` deleted
- **react-typography + typography removed:** replaced with `<link>` tag + VE `globalStyle` (also fixed broken Google Fonts loading)
- **react-toggle removed:** replaced with native `<input type="checkbox">` + VE CSS toggle
- **rc-slider removed:** replaced with native `<input type="range">`
- **FontAwesome (3 packages) removed:** replaced with `react-icons`
- **formik removed:** replaced with `react-hook-form` + `zod` + `@hookform/resolvers`
- **roundrobin removed:** dead code (own implementation in `src/services/round-robin.ts`)
- RTK `createAction` for all 12 ducks complete — zero hand-rolled action creators remain
- RTK `createReducer` for all 12 ducks complete — zero `switch/case` reducers, zero `action: any`, zero manual `produce()` calls
- All exported string action constants eliminated — action creators used everywhere (sagas, components, cross-duck refs)
- `putResolve` fully eliminated (36 sites → `put`)
- `Root.tsx` simplified: no more `ThemeProvider`, `TypographyStyle`, or `createGlobalStyle`
- **XState 5 introduced** for UI wizard flows — prank selection machine is first implementation
- **`advanceEnabled` derived from state** — replaced stored boolean with selector (`phase !== "event" || allEventsResolved`)
- **`MetaManager` form defaults moved to local component state** (`ManagerForm.tsx`)
- **XState PR 3 (type foundations) complete:** `GameContext`, `EventCommand` union, context-aware selectors in `src/machines/`
- **`totalGamesPlayed` selector bug fixed** — was returning `undefined` when stats existed, `0` when missing (inverted). Now correctly sums `record.win + record.draw + record.loss`. Fixed in both Redux (`src/selectors.ts`) and XState (`src/machines/selectors.ts`) worlds.
- **`remeda` adopted codebase-wide** — `Object.entries()`, `Object.values()`, `Object.keys()` replaced with `entries()`, `values()`, `keys()` from remeda across ~30 files (selectors, ducks, sagas, components, tests) for better TypeScript key type preservation
- **XState PR 4 (`@xstate/store` for leaf ducks) complete:** `ui`, `country`, `notification` migrated to `@xstate/store` instances in `src/stores/`. Dual-write sync middleware (`src/stores/sync.ts`) bridges Redux → XState. Components read from XState stores. Stately Inspector added for dev visualization (`src/stores/inspector.ts`).
- **XState PR 5 (`appMachine`) complete:** `src/machines/app.ts` (pure machine definition), `src/machines/actors.ts` (singleton actor instantiation). States: `menu` → `starting`/`loading` → `inGame`. Sync middleware bridges `startGame`/`loadGame`/`seasonStart`/`gameLoaded`/`quitToMainMenu` → machine events. `App.tsx` and `StartMenu.tsx` read from `appActor` via `useSelector` from `@xstate/react`.
- **`RandomService` + `createRandom(seed)` factory** — `src/services/random.ts` exports typed `RandomService` interface (`integer`, `real`, `bool`, `pick`, `cinteger`), `createRandom(seed)` for deterministic test instances, and `createGameService(random)` closure in `game.ts` for DI. Tests use real seeded random instead of `vi.mock`.
- Zero TypeScript errors maintained throughout all migrations

---

## Migration Status (as of 2026-04-12)

### Completed de-immutable + TypeScript conversions

**Data files:**

- `src/data/countries.ts` — plain `Country` type + `Record<string, Country>`
- `src/data/teams.ts` — plain `TeamDefinition[]` array
- `src/game/pranks.ts` — plain `Record<string, Prank>` + `PrankInstance` type (moved from `data/`)
- `src/data/difficulty-levels.ts` — plain `DifficultyLevel[]` array
- `src/data/named-effects.ts` — plain `Record<string, NamedEffectFn>` (Immutable Map param removed)
- `src/services/effects.ts` — fully typed with plain `Team` + `TeamEffect` (no more Immutable)
- `src/data/managers.ts` — plain `ManagerDefinition[]` array
- `src/data/calendar.ts` — typed `CalendarEntry[]` array with `Seed` type
- `src/data/services.ts` — typed `Record<string, ServiceDefinition>` with effect/price functions
- `src/data/transfer-market.ts` — typed `PlayerType[]` array
- `src/data/strategies.ts` — typed `Strategy[]` array
- `src/data/crisis.ts` — typed crisis data (was already plain, types added)
- `src/sagas/awards.ts` — typed award/random-event system (moved from `data/`, was `awards.js` with Immutable `List.of`)
- `src/game/events.ts` — inferred `as const` event registry (moved from `data/`, was `Record<string, any>`)
- `src/services/random.ts` — typed, deterministic seed support via `VITE_RANDOM_SEED`

**Reducers (ducks):**

- `src/ducks/prank.ts` — plain `{ pranks: PrankInstance[] }` + RTK `createReducer`
- `src/ducks/ui.ts` — plain `UiState` (`{ menu: boolean }`) + RTK `createReducer`; `advanceEnabled` removed (derived from `game.turn.phase` + `event.events` via selector in `src/selectors.ts`)
- `src/ducks/event.ts` — RTK `createReducer`
- `src/ducks/game.ts` — **root is plain `GameState`** + RTK `createReducer`; `teams` is typed `Team[]`; `competitions` is typed `Record<string, Competition>`; `managers` is `ManagerDefinition[]`; `flags` is typed `GameFlags`
- `src/ducks/manager.ts` — plain `ManagerState` + RTK `createReducer` (`Manager` type with `ManagerArena`, `ManagerServices`)
- `src/ducks/betting.ts` — plain `BettingState` + RTK `createReducer` (`ChampionshipBet[]`, `Bet[]`)
- `src/ducks/news.ts` — plain `NewsState` + RTK `createReducer` (`string[]` news, `Record<string, string[]>` announcements)
- `src/ducks/notification.ts` — plain `NotificationState` + RTK `createReducer` (`Notification[]`, capped at 3)
- `src/ducks/invitation.ts` — plain `InvitationState` + RTK `createReducer` (`Invitation[]`)
- `src/ducks/stats.ts` — plain `StatsState` + RTK `createReducer` (`SeasonStats[]`, `Streak`, `GameRecord`, `ManagerGameStats`)
- `src/ducks/country.ts` — RTK `createReducer`
- `src/ducks/meta.ts` — plain `MetaState` (`{ started, loading, saving, starting }`) + RTK `createReducer`; `MetaManager` form defaults moved to `ManagerForm.tsx`

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

- ~~CSS `:global` pseudo-class warnings from lightningcss (legacy `.pcss` file)~~ **Fixed** — `.pcss` file deleted, all styles now in VE

### Completed: Vanilla Extract migration (2026-04-11)

Replaced the entire styled-components + styled-system + PostCSS styling stack with Vanilla Extract in a single session.

**Foundation files created:**

- `src/styles/theme.css.ts` — `createGlobalTheme(":root", { color, space })` matching old theme values
- `src/styles/sprinkles.css.ts` — `defineProperties` + `createSprinkles` for padding/margin/color utility props
- `src/styles/global.css.ts` — `globalStyle` for html, body, form, p + normalize.css import + typography + spin animation

**Components converted (27+ files):**

- Form primitives: Button, ButtonRow, Field, Input, Label, LabelDiv, Select, Toggle (new), Slider (new)
- UI primitives: HeaderedPage, ButtonContainer, Tab, Tabs, Loading
- Layout: Box (sprinkles-based, maps old numeric props to space scale)
- Game components: Notification, Notifications, Header, ModalMenu, ManagerInfo, Current, Services, Arena, StartMenu, Game
- Data display: league-table/Table, gameday/Game, gameday/Results, team/Name, responsive-table/Td, responsive-table/ResponsiveTable

**Pattern:** Each component gets a `.css.ts` file with VE `style()` + optional `globalStyle()` for nested selectors. Components use `clsx` for conditional class composition. Custom props (e.g. `$dark`, `$humanControlled`) replaced with explicit className logic.

**Packages removed:** styled-components, styled-system, @types/styled-system, postcss-import, postcss-preset-env, postcss-advanced-variables, postcss-nested

**Packages added:** @vanilla-extract/css, @vanilla-extract/sprinkles, @vanilla-extract/vite-plugin, clsx

### Completed: Legacy dependency purge (2026-04-11)

Systematically replaced heavy/abandoned dependencies with modern equivalents or native browser APIs:

| Removed                                                 | Replaced with                             | Packages shed              |
| ------------------------------------------------------- | ----------------------------------------- | -------------------------- |
| `styled-components` + `styled-system`                   | Vanilla Extract + sprinkles               | ~18                        |
| `react-typography` + `typography` + `@types/typography` | `<link>` tag + VE `globalStyle`           | ~16                        |
| `react-toggle`                                          | Native `<input type="checkbox">` + VE CSS | ~3                         |
| `rc-slider`                                             | Native `<input type="range">`             | ~7                         |
| `@fortawesome/*` (3 packages)                           | `react-icons`                             | ~7                         |
| `formik`                                                | `react-hook-form` + `zod`                 | ~12 (net ~-6)              |
| `roundrobin`                                            | Already had own impl                      | ~1                         |
| `postcss-*` (4 plugins)                                 | Deleted (no CSS preprocessing needed)     | ~96                        |
| `prop-types`                                            | Killed with its hosts                     | ~1                         |
| **Total**                                               |                                           | **~150+ packages removed** |

**Bundle trajectory (single session):**

- JS: 806kB → **622.69kB** (−22.7%, gzip 196kB)
- CSS: runtime-generated → **7.08kB** static (gzip 1.94kB)

### Gotchas learned from Vanilla Extract migration

- **`styled(Component)` wrapper pattern:** Components like `styled(Current)\`...\``need the styles moved to a class applied directly. Remove the`className` prop threading and apply the VE class in the component itself.
- **`${Component}` interpolation in styled-components:** Used for sibling/child selectors (e.g. `${Tab} + ${Tab}`). In VE, export the class string from the component's `.css.ts` and use it in `globalStyle` selectors.
- **Empty `styled(X)\`\`` wrappers:** Some components (e.g. `Game.tsx`) had no-op styled wrappers. Just remove the wrapper entirely.
- **PostCSS transitive dependency trap:** Removing `react-toggle` killed `prop-types` as a transitive dep, which broke `react-typography`. Solution: kill both. Native CSS + `<link>` tag is simpler anyway.
- **`rc-slider` onChange types:** `rc-slider` passes `number | number[]` to onChange. Native `<input type="range">` passes an event — wrapper component normalizes to `(value: number) => void`.
- **Formik nesting bug found during migration:** `betting/BettingForm.tsx` had the "2" radio incorrectly nested inside the "x" label. Fixed during react-hook-form conversion.

### Completed: RTK `createAction` for all 12 ducks (2026-04-11)

Converted all action creators from hand-rolled `{ type: "...", payload }` functions to RTK `createAction<PayloadType>("ACTION_TYPE")`. Reducer switch/cases kept with string constants for now (natural `createSlice` migration later).

**Ducks (12/12 complete):**

- `meta.ts` — 7 creators: `quitToMainMenu`, `startGame`, `saveGame`, `loadGame`, `gameLoadState`, `gameLoaded`, `gameStart`
- `game.ts` — ~30 creators covering game lifecycle, competition, team, gameday actions (prefixed: `teamSetStrategy`, `competitionSeed`, etc.)
- `news.ts` — 3 creators: `addAnnouncement`, `clearAnnouncements`, `addNews`
- `betting.ts` — 4 creators: `placeBet`, `requestBet`, `placeChampionBet`, `requestChampionBet`
- `country.ts` — 2 creators: `alterStrength`, `setStrength`
- `event.ts` — 5 creators: `addEventAction`, `resolveEventAction`, `clearEvents`, `setEventProcessed`, `requestResolveEvent`
- `invitation.ts` — 3 creators: `addInvitation`, `acceptInvitationAction`, `requestAcceptInvitation`
- `prank.ts` — 3 creators: `orderPrank`, `addPrank`, `dismissPrank` (3 prank-selection creators removed — moved to XState machine)
- `notification.ts` — 2 creators: `addNotification`, `dismissNotification`
- `ui.ts` — 2 creators: `toggleMenu`, `closeMenu` (`disableAdvance`/`enableAdvance` removed — derived; `selectTab` removed — dead code)
- `stats.ts` — 2 creators: `updateFromFacts`, `setSeasonStat`
- `manager.ts` — 18 creators: 12 state-changing (`managerAdd`, `managerSetActive`, `managerSetBalance`, etc.) + 6 request/saga-intercepted (`managerToggleService`, `managerBuyPlayer`, `managerSelectStrategy`, `managerImproveArena`, `managerSellPlayer`, `managerCrisisMeeting`)

**Patterns established:**

- **Naming:** Clean names in duck. Manager duck uses `manager`-prefix to avoid collision with saga helpers of the same name (e.g., `managerSetBalance` in duck, `setBalance` saga helper).
- **Saga imports:** Alias on import when saga function has same name as action creator: `import { addNews as addNewsAction } from "../ducks/news"`.
- **Cross-duck refs:** Use `.type` from imported createAction creators (e.g., `cancelPrank.type` in ui reducer).
- **Component dispatch:** Object payload pattern: `dispatch(managerCrisisMeeting({ manager: manager.id }))`.
- **takeEvery:** Pass creator directly: `takeEvery(managerBuyPlayer, buyPlayer)` — no more `as any` casts (except one remaining `META_GAME_SAVE_REQUEST` in `phase/action.ts` — trivially fixable).

**Also completed:**

- `putResolve` fully eliminated (36 sites across 13 files → `put`)
- `awards.ts` refactored from `redux-saga/effects` to `typed-redux-saga` with `yield*`
- Zero raw `type: "..."` in put() calls remain in saga files
- Only 1 string-pattern `takeEvery` remains: `"META_GAME_SAVE_REQUEST"` in `phase/action.ts` (can use `saveGame` creator from `meta.ts`)

### Remaining `as any` inventory: ✅ ZERO (2026-04-12)

**All 32 `as any` casts eliminated.** Zero `as any` in `src/`. Key fixes:

1. ~~**Event data `options()` return casts (17 files):**~~ ✅ Fixed — `MHMEvent` generic widened with second type param `CData extends BaseEventCreationFields`; event `options()` return type no longer conflicts with literal keys.
2. ~~**Reducer `action: any` (11 remaining ducks):**~~ ✅ Fixed — `createReducer` migration eliminates this entirely.
3. ~~**Manager services cast (2 sites):**~~ ✅ Fixed — `managerHasService` selector now takes `keyof ManagerServices`.
4. ~~**Saga boundary casts (4 sites):**~~ ✅ Fixed — `GameInput` typed with `Manager`, `phaseId: number`, `CompetitionId`; `simulate` imported directly (default export wrapper removed).
5. ~~**Component prop casts (2 sites):**~~ ✅ Fixed — `cloneElement` casts in `Tabs.tsx` and `ResponsiveTable.tsx` simply removed (React 19 types handle it).

**Other fixes in the sweep:**

- `teamIncurPenalty` — proper `group.type === "round-robin"` narrowing instead of `as any` cast
- `events` registry — `as const` instead of `Record<string, any>`
- `remeda.entries()` used in game service for type-safe key iteration
- `data/events.ts` — untyped `Record<string, any>` → inferred `as const` object

### Completed: `redux-saga/effects` fully eliminated (2026-04-11)

Zero `redux-saga/effects` imports remain in `src/`. Last 4 holdouts fixed:

- `src/types/base.ts` — `Effect` type replaced with `unknown` in `MHMEventGenerator`
- `src/getSagas.ts` — `all`, `setContext` → `typed-redux-saga` + `yield*`
- `src/data/competitions/ehl.ts` — 12× `yield` → `yield*`
- `src/data/competitions/tournaments.ts` — 9× `yield` → `yield*`

### Completed: `(state: any)` → `RootState` in data layer (2026-04-11)

Eliminated all 20 `(state: any)` casts across 8 files in `src/data/`:

- **Event files (5):** `enemy-protest.ts`, `sell-narcotics.ts`, `bazooka-strike.ts`, `etelala-glitch.ts`, `joboffer-phl.ts`
- **Competition files (2):** `ehl.ts`, `tournaments.ts`
- **Awards:** `awards.ts`

All now import `RootState` from `src/config/redux`. This also eliminated downstream `(t: any)`, `: any` declaration casts, and `(g: any)` callback casts that were only needed because the selector returned `any`.

**Key discovery:** The `enemy-protest.ts` Immutable ghost crash (`.filterNot()` on plain `Record`) would have been caught at compile time with `RootState` typing. Inline `(state: any)` selectors are a type-safety escape hatch that masks real bugs.

**Future direction:** Promote repeated inline selectors to named selectors in `src/selectors.ts` — these work identically with both `yield* select(selector)` in sagas and `useAppSelector(selector)` in components.

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
- **`all([fork(), takeEvery(), ...])` blocks forever with typed-redux-saga:** With raw `redux-saga/effects`, `fork()`/`takeEvery()` return effect descriptors (plain objects). `all([...])` processes them directly and resolves with an array of Tasks. With typed-redux-saga, they return **generators**. `all` runs each generator as a child saga — each child forks an internal watcher that never completes, so `all` blocks forever. **Fix:** Wrap all watchers in a single `fork(function* () { yield* all([...]); })`, then cancel the single forked task. The `all` inside blocks forever (correct — watchers run until cancelled), and `cancel` cascades to all children.

---

## Non-Negotiables for Agents

0. **Raise concerns early**
   - If something looks wrong, smells wrong, or might break something — say so immediately. Better to flag a false alarm than miss a real problem.
   - This applies to code review, migration steps, architectural decisions, and runtime behavior.
   - Don't self-censor concerns to avoid slowing things down.

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

6. **State homes: Redux/XState or `useState` — nothing in between**
   - State lives in Redux (global, cross-component), XState machines/stores (when migrated per XSTATE-REFACTORING.md), or `useState` (local, component-scoped). Period.
   - Do not introduce React Context as a state management layer. Context is for dependency injection (themes, i18n providers), not for shuttling mutable state around the tree.
   - During the XState migration, dual-write (Redux + XState) is acceptable temporarily. See XSTATE-REFACTORING.md for the transition plan.

7. **Page/leaf component boundary**
   - **Page components** (route-level screens that assemble a view) may use `useAppSelector`/`useAppDispatch` and talk to the Redux store directly.
   - **Leaf components** (render UI, handle interaction) must stay store-agnostic: data in via props, user intent out via callback props. No `useAppSelector`, no `useAppDispatch`, no action creator imports.
   - This is the same presentational/container split from the `connect()` era, now enforced by discipline instead of file boundaries. Hooks make coupling frictionless — stay vigilant.

8. **Type safety must trend upward**
   - New/edited modules should be TypeScript where feasible.
   - Add lightweight types around action payloads/selectors touched by a change.
   - Prefer `type` aliases by default; use `interface` only when declaration merging/extension semantics are explicitly needed.
   - For React components, prefer the `FC<Props>` typing style where practical and readable.
   - `type-fest` is installed (devDep) — use it freely for utility types (`Simplify`, `PartialDeep`, `SetRequired`, `Opaque`, etc.) instead of reinventing them.
   - `remeda` is installed — prefer `entries()`, `values()`, `keys()` from remeda over `Object.entries/values/keys` for better key type preservation (avoids `string` widening). This is now standard practice codebase-wide (~30 files converted). For other utilities, prefer native JS first, then `remeda` (do not reintroduce `ramda`).

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
- RTK `createAction` for all action creators — pass creator to `takeEvery`/`take` instead of string constants
- `TeamStat`/`PlayoffGroup` casts needed when accessing `Group` union stats
- Shared domain types in `src/types/` (competitions, base events)

### P2.75 — RTK `createAction`: ✅ COMPLETE

**As of 2026-04-11, all 12 ducks have RTK `createAction` creators.** Zero hand-rolled action creators remain. `putResolve` fully eliminated.

Next natural step: `createReducer` conversion (replaces switch/case + eliminates `action: any` + automatic immer). Pilot completed on `meta.ts` — see strategy below.

### P2.8 — RTK `createReducer` migration: ✅ COMPLETE

**As of 2026-04-11, all 12 ducks converted** from `switch/case` + manual `produce()` to RTK `createReducer` with builder API.

**What it gave us:**

- `addCase(actionCreator, handler)` for single-action cases — fully typed payloads
- `addMatcher(predicate, handler)` for multi-action cases (e.g. `SEASON_START` and `gameLoaded` both set `{ started: true, loading: false }`)
- `immer` import removed from all ducks — RTK bundles it, `createReducer` wraps handlers automatically
- `action: any` parameter eliminated from all 12 ducks
- All exported string action constants eliminated — action creators used in `addCase`, sagas, components, and cross-duck refs
- Dead reducer cases discovered and removed (e.g. `SEASON_START_REQUEST` in meta)

**Why `createReducer` over `createSlice`:** `createSlice` auto-prefixes action types (e.g. `meta/quitToMainMenu` instead of `"META_QUIT_TO_MAIN_MENU"`). Since cross-duck action constants are referenced in 8+ reducer files, `createSlice` would cascade changes across the codebase. `createReducer` gives the same builder API and automatic immer without changing any action type strings.

**Circular dependency gotcha:** `game.ts` ↔ `meta.ts` cycle caused `Cannot access 'nextTurn' before initialization`. Root cause: `game.ts` imports from `meta.ts`, `meta.ts` imported `seasonStart` from `game.ts`. Fix: `meta.ts` uses `action.type === "SEASON_START"` string literal in its matcher instead of importing the creator.

### P2.9 — XState migration (active — see XSTATE-REFACTORING.md)

**XState 5 + @xstate/react installed.** Full migration plan in [`XSTATE-REFACTORING.md`](XSTATE-REFACTORING.md). First machine: prank selection wizard.

**`src/machines/prankSelection.ts`:**

- States: `idle` → `typeSelected` → `victimSelected`
- Events: `SELECT_TYPE`, `SELECT_VICTIM`, `ORDER`, `CANCEL`
- Context: `{ type: string | undefined, victim: number | undefined }`
- Uses `setup()` API for full TypeScript inference

**Wired into `Pranks.tsx`** via `useMachine()` — replaced `useAppSelector(state.ui.prank)` + Redux dispatches with `[state, send]`. `dispatch(orderPrank(...))` still used for the Redux saga trigger.

**Boundary pattern:** XState owns UI wizard state (ephemeral, component-scoped). Redux owns persistent game state (pranks queue, team effects). The machine doesn't talk to Redux — the component bridges them.

**XState v5 context narrowing:** v5 doesn't auto-narrow context per state. Pragmatic pattern: `!` assertions at the `state.matches()` boundary in the component. Per-state exported types were tried and reverted as over-engineering for small machines.

### P2.95 — Derived state: `advanceEnabled` (complete)

**Replaced stored `advanceEnabled` boolean** in `ui.ts` with a derived selector in `src/selectors.ts`:

```ts
export const advanceEnabled = (state: RootState) =>
  state.game.turn.phase !== "event" ||
  !values(state.event.events).some((e) => !e.resolved);
```

**Key insight:** The phase check is critical — events can be unresolved during creation phases (earlier in the turn) but should only block advance during the `"event"` phase when the player actually resolves them.

**Removed:** `disableAdvance`/`enableAdvance` actions from `ui.ts`, dispatches from `sagas/phase/event.ts`, dead read from `News.tsx`. The `ui` duck now only holds `{ menu: boolean }`.

### P3 — State architecture evolution: XState migration (active)

- **Regression test harness: ✅ COMPLETE** — 105 vitest tests (81 new: calendar, store init, reducers, game simulation, save/load). Key discovery: calendar has **75 rounds** (0–74), not 54.
- **`src/data/` cleanup: ✅ COMPLETE** — logic files moved out, `data/` is now pure data only. Selectors → `src/selectors.ts`, awards → `src/sagas/awards.ts`, events/pranks → `src/game/`, tournament eligibility → `src/sagas/tournament-eligibility.ts`.
- **Import normalization: ✅ COMPLETE** — all 709 `../` relative imports across 189 files normalized to `@/` alias paths.
- **XState type foundations (PR 3): ✅ COMPLETE** — `src/machines/types.ts` (`GameContext`), `src/machines/commands.ts` (`EventCommand` — 25-variant discriminated union), `src/machines/selectors.ts` (all Redux selectors mirrored as `ContextSelector<T>` reading from `GameContext`). `totalGamesPlayed` bug found and fixed in both Redux and XState selectors.
- **XState PR 4 (`@xstate/store` for leaf ducks): ✅ COMPLETE** — `src/stores/ui.ts`, `src/stores/country.ts`, `src/stores/notification.ts` created with `@xstate/store`. Sync middleware (`src/stores/sync.ts`) dual-writes Redux actions → XState stores using RTK `.match()` type guards. Components read from XState stores via `useSelector` from `@xstate/store-react`. Stately Inspector (`src/stores/inspector.ts`) added for dev-only visualization.
- **XState PR 5 (`appMachine`): ✅ COMPLETE** — `src/machines/app.ts` exports pure machine definition (states: `menu`, `starting`, `loading`, `inGame`). `src/machines/actors.ts` is the central wiring point for all actor instantiation (machine definitions stay pure, actors live here). Sync middleware bridges Redux meta actions → machine events. `App.tsx` reads `state.matches("inGame")`, `StartMenu.tsx` reads `state.matches("starting")` via `useSelector(appActor, ...)` from `@xstate/react`. Note: `SEASON_START` fires every season (not just the first) — the machine silently ignores `GAME_STARTED` when already in `inGame`. Harmless, goes away when game machine owns season transitions.
- **Architectural decision: machine files vs actor files** — Machine files (`src/machines/*.ts`) export only the machine definition + types. Actor instantiation lives in `src/machines/actors.ts`. This keeps machine files pure and side-effect-free, avoids module-level `createActor().start()` in machine files, and provides a single wiring point for all actors.
- **PR 6 combines persistence extraction + gameMachine skeleton** — Original PR 6 (persistence) was too thin on its own. Now: `src/machines/game.ts` (central game machine with `GameContext`, round states, calendar lookup) + `src/services/persistence.ts` (extracted save/load). This is the big one.
- **Next:** PR 6 (`gameMachine` skeleton + persistence — the big one). See XSTATE-REFACTORING.md.
- **Full plan:** Hierarchical actor model — `appMachine` → `gameMachine` → phase machines. ~20 PRs across 5 phases. See XSTATE-REFACTORING.md for details.

### P4 — Styling: ✅ COMPLETE

**As of 2026-04-11, Vanilla Extract migration is complete.** All 27+ styled-components converted to VE `.css.ts` files. styled-components, styled-system, and Emotion fully removed. PostCSS fully removed. Typography handled by native `<link>` + VE `globalStyle`.

Stack: `@vanilla-extract/css` + `@vanilla-extract/sprinkles` + `clsx` for conditional classes.

### P4.5 — Dependency modernization: ✅ COMPLETE

**As of 2026-04-11, all legacy/abandoned UI dependencies replaced:**

- `react-toggle` → native checkbox + VE CSS
- `rc-slider` → native range input
- `react-typography` + `typography` → `<link>` tag + VE globalStyle
- `@fortawesome/*` → `react-icons`
- `formik` → `react-hook-form` + `zod` + `@hookform/resolvers`
- `roundrobin` → own implementation (was already dead)

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
- event generation and calendar-dependent flows (`src/sagas/phase/**`, `src/data/calendar.ts`, `src/game/events.ts`, `src/game/events/`)
- save/load serialization (`JSON.stringify`/`JSON.parse` in `src/sagas/meta.ts`)

When touching these areas:

- keep action names stable unless migration requires otherwise
- preserve reducer shape and key paths
- explicitly verify save/load still works

---

## Working Rules for Future Agents

### Before coding

- Read the affected file(s) fully.
- Read [`XSTATE-REFACTORING.md`](XSTATE-REFACTORING.md) if working on state management, sagas, or the XState migration.
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
4. ~~Add a small regression suite around game start/load/save, turn phase progression, event creation.~~ ✅ Done — 105 tests via `pnpm run test`.
5. Playwright e2e tests using deterministic seed (`VITE_RANDOM_SEED=X pnpm dev`) — same seed + same clicks = same game.
6. ~~Continue TypeScript migration of remaining `.js`/`.jsx` files.~~ ✅ Done.
7. ~~Audit stale peer dependency warnings (react-pose, react-toggle, react-typography, react-helmet all have React 19 peer issues).~~ Mostly resolved — react-toggle, react-typography removed. Only react-helmet remains (evaluate `react-helmet-async` or native `<title>` API).
8. ~~Tighten `tsconfig.json`: remove `allowJs` (no JS left), consider enabling `noImplicitAny` incrementally.~~ `allowJs` removed. `noImplicitAny` still a candidate.
9. ~~Clean up `any` casts introduced during saga migration (`takeEvery` string patterns, `race` result payloads) — these become unnecessary once action creators exist.~~ ✅ Done — zero `as any` in `src/` as of 2026-04-12.
10. ~~Fix the `Root.tsx` `DefaultTheme` typing gap (precursor to P4 Vanilla Extract migration).~~ ✅ Done (VE replaced styled-components entirely).
11. ~~Remove `@redux-saga/delay-p` from dependencies (sole consumer was `notification.js`, now uses `typed-redux-saga`'s `delay`).~~ ✅ Already removed.
12. Fix last string-pattern `takeEvery("META_GAME_SAVE_REQUEST")` in `phase/action.ts` — trivial, use `saveGame` from `meta.ts`.
13. ~~Type the `MHMEvent.options` return to eliminate 17 event `as any` casts~~ ✅ Done — `MHMEvent` widened with `BaseEventCreationFields` second generic.
14. ~~Evaluate `createSlice` migration for simpler ducks~~ — Superseded by XState migration plan. See XSTATE-REFACTORING.md.
15. ~~**Next XState PR:** PR 3 (type foundations) — `GameContext` type, `EventCommand` union, context-based selectors.~~ ✅ Done. ~~**Next:** PR 4 (`@xstate/store` for ui, country, notification).~~ ✅ Done. ~~**Next:** PR 5 (meta/app lifecycle — `appMachine`).~~ ✅ Done. **Next XState PR:** PR 6 (`gameMachine` skeleton + persistence extraction). See XSTATE-REFACTORING.md.

---

## Decision Heuristics

When unsure, prefer:

- explicitness over magic
- typed boundaries over implicit `any`
- isolated migrations over broad rewrites
- proven behavior over architectural purity

The objective is to ship a stable modern codebase, not to “rewrite everything at once.”
