# AGENTS.md

## Mission

Polish `mhm-97-remake` toward an eventual **MHM 2000 remake** pivot. The codebase is the foundation; we keep improving it until it's ready to grow.

The big modernization is **done**: Redux/sagas removed, Immutable.js removed, TypeScript everywhere, XState 5 owns all game state, Vanilla Extract for styles, native browser inputs replacing abandoned UI libs.

Current phase is **incremental polish**:

- Tighten the declarative event/prank system, remove duplication, kill latent bugs.
- Fix gameplay bugs as they surface (playtesting is the primary discovery channel).
- Improve the UI — it works, but it's ugly.
- Round out per-competition extension points so MHM 2000's larger competition set drops in cleanly.
- Keep `GameContext` shape stable enough that loaded saves don't shatter.

When the foundation is solid, we pivot to MHM 2000.

---

## Current Stack (2026-04-27)

- **Build / runtime:** Vite 8, Node 24 (`.nvmrc` => `v24`), pnpm-only
- **UI:** React 19, React Router 7, react-icons (FA solid)
- **State:** XState 5 (`appMachine` + `gameMachine` + spawned children) and `@xstate/store` for leaf stores (`ui`, `country`, `notification`)
- **Styling:** Vanilla Extract (`@vanilla-extract/css` + `@vanilla-extract/sprinkles`), `clsx` for conditional classes
- **Forms:** react-hook-form + zod + `@hookform/resolvers`
- **Mutations:** immer (mandatory for any nested state mutation)
- **Utilities:** remeda (`entries`, `values`, `keys` over native `Object.*`), type-fest (devDep)
- **Persistence:** slot-based via [src/services/persistence.ts](src/services/persistence.ts) — `saveSnapshot(slot, snap)` / `loadSnapshot(slot)` / `hasSnapshot(slot)`. Storage key `mhm97:slot:N`. Persists the full XState snapshot via `gameRef.getPersistedSnapshot()`.
- **Randomness:** `RandomService` in [src/services/random.ts](src/services/random.ts), seedable via `VITE_RANDOM_SEED`
- **TypeScript:** TS 7 native preview (`tsgo`) — `pnpm typecheck` runs `tsgo --noEmit` (~0.3s). The legacy `typescript` package is **not** installed.
- **Lint/format:** `oxlint` + `oxfmt` (auto-discovered config files; no `-c` flag)
- **Tests:** vitest, ~173 tests across 15 files (alongside source as `*.test.ts`)

### Key files

- Entry: [src/client.tsx](src/client.tsx) → [src/Root.tsx](src/Root.tsx) → `<AppMachineContext.Provider>` → [src/components/App.tsx](src/components/App.tsx)
- Machines:
  - [src/machines/app.ts](src/machines/app.ts) — root lifecycle (`menu` ↔ `starting` / `loading` ↔ `playing`), spawns `gameMachine`, owns save/load
  - [src/machines/game.ts](src/machines/game.ts) — main gameplay machine (~2k lines: phases, events, gameday, end-of-season compound state)
  - [src/machines/end-of-season.ts](src/machines/end-of-season.ts) — pure draft mutators for the EOS flow (`runWorldChampionships`, `runAwards`, `runFinalizeStats`, `runSeasonEnd`)
  - [src/machines/notifications.ts](src/machines/notifications.ts) + [src/machines/notification.ts](src/machines/notification.ts) — toast subtree
  - [src/machines/bet.ts](src/machines/bet.ts) + [src/machines/championBet.ts](src/machines/championBet.ts) — spawned bet actors
  - [src/machines/prankSelection.ts](src/machines/prankSelection.ts) — UI wizard for prank ordering
  - [src/machines/selectors.ts](src/machines/selectors.ts) — `ContextSelector<T>` and `SnapshotSelector<T>` predicates
  - [src/machines/types.ts](src/machines/types.ts) + [src/machines/commands.ts](src/machines/commands.ts) — shared event types
- State shapes: [src/state/](src/state/) — one file per slice (`game.ts`, `manager.ts`, `betting.ts`, …), plus [src/state/game-context.ts](src/state/game-context.ts) (full `GameContext`) and [src/state/defaults.ts](src/state/defaults.ts) (`createDefaultGameContext()`)
- Leaf stores: [src/stores/ui.ts](src/stores/ui.ts), [src/stores/country.ts](src/stores/country.ts), [src/stores/notification.ts](src/stores/notification.ts)
- Game data: [src/data/](src/data/) — pure data only (calendar, teams, managers, services, arenas, …)
- Events: [src/game/new-events/](src/game/new-events/) — 96 declarative events in `(ctx, data) => EventEffect[]` form, registered in [src/game/new-events/index.ts](src/game/new-events/index.ts), random-roll table in [src/game/new-events/table.ts](src/game/new-events/table.ts)
- Pranks: [src/game/pranks.ts](src/game/pranks.ts) — declarative prank registry
- Effect interpreter: [src/game/event-effects.ts](src/game/event-effects.ts) — `applyEffects(draft, effects, spawnEvent)`
- Import alias: `@/*` → `./src/*`

---

## Architecture Overview

### State homes

- **`appMachine`** owns lifecycle: which screen (`menu` / `starting` / `loading` / `playing`), and the `gameRef` to the spawned `gameMachine`.
- **`gameMachine`** owns all gameplay state. Its context is `GameContext` extended with round-management scratch fields (`currentRoundCalendar`, `remainingPhases`, `currentPhase`). States: `idle` → `playing` (compound: `roundStart` → `executingPhases` → `roundEnd`), with `executingPhases` itself a compound state covering one entry per phase id.
- **`@xstate/store` instances** for ephemeral or cross-cutting UI state (`ui` menu open/closed, `country` flags, `notification` queue mirror). Components read via `useSelector` from `@xstate/store-react`.
- **`useState`** for component-local state (form drafts, tab indices).
- **NEVER React Context as a state layer** — Context is for dependency injection (e.g. providing the `gameActor` via `GameMachineContext.Provider`). State lives in machines/stores or `useState`.

### Page / leaf component boundary

- **Page components** (route-level screens) may consume `GameMachineContext.useSelector(...)`, `GameMachineContext.useActorRef()`, `AppMachineContext.useSelector(...)`, and the `@xstate/store` instances directly.
- **Leaf components** stay store-agnostic: data in via props, intent out via callback props. No machine/store imports.

### Persistence

`saveSnapshot(slot, gameRef.getPersistedSnapshot())` captures the full snapshot — invoked children, spawned actors, all of it. `createActor(gameMachine, { snapshot })` rehydrates the whole tree. Only slot 1 is wired (the slot picker UI is future work; MHM 2000 had 6 slots). The persisted blob is opaque JSON — treat it as such.

---

## XState 5 Conventions (LOCKED)

These are the rules every new machine code must follow. Most were learned the hard way; deviations cause subtle bugs.

### `setup({ actions, guards, actors })` always

Use **referenced actions** (`actions: { foo: assign(…) }` + handlers reference `{ type: "foo", params: ({ event }) => event.payload }`) over function-form actions. Function-form trips the `executingCustomAction` dev-mode warning when the body sends to children or spawns anything.

### `enqueueActions` when one action needs both `assign` + `sendTo`

Lets you compute a one-time value (e.g. random roll) and reference it from both. See `executeBuyPlayer` / `executeSellPlayer` / `executeCrisisMeeting`. Don't fall back to inline action arrays when a value needs to be shared.

### `assign(({ context }) => produce(context, (draft) => …))` for state changes

Always use immer. Never spread-based nested updates. Never mutate `context` directly.

### Selectors: `ContextSelector<T>` and `SnapshotSelector<T>`

Live in [src/machines/selectors.ts](src/machines/selectors.ts). Curried form `(args) => (ctx) => T` (or `(args) => (snap) => T` when `state.matches(...)` is needed). Same predicate is used two ways:

- `useGameContext(canCrisisMeeting(managerId))` in components
- `guard: ({ context, event }) => canCrisisMeeting(event.payload.manager)(context)` in the machine

**Never duplicate the rule.** UI gating and machine guards must read the same selector.

### Two-transition pattern for guarded events with feedback

When the failure path needs UI feedback ("Myyntilupa evätty"), use an array of transitions:

```ts
SELL_PLAYER: [
  { guard: …, actions: executeSellPlayer },
  { actions: notifyDenied }
]
```

Don't silently swallow rejected events.

### Selectors are pure — no data lookups

Selectors take `ctx` (and optional args) and return a value. They don't reach into `prankTypes[type].price(competition)` etc. — push lookups to the call site to avoid circular import chains.

### Pass fresh refs into machine context

The Stately Inspector dedupes shared object references and stubs them as `"[...]"` placeholders. See [src/state/defaults.ts](src/state/defaults.ts): `[...managerDefs]` not the imported singleton.

### Spawned children + persistence

- `getPersistedSnapshot()` walks invoked + spawned children deeply. `createActor(machine, { snapshot })` rehydrates the entire tree. Confirmed: parlay bets in `placed`, championship-betting wizard mid-flow, notification subtree — all survive save/load.
- For cross-actor messaging, use `systemId` + `system.get()`, **never store actor refs in context for messaging**. Function references don't survive `JSON.stringify`. The parent `gameMachine` registers itself with `systemId: "game"` in [src/machines/app.ts](src/machines/app.ts); children call `sendTo(({ system }) => system.get("game"), …)`.
- `sendParent` is also unreliable across rehydration — use `systemId` lookup instead.

### `spawn()` vs `createActor()` for restoration

`spawn()` (inside `setup({ actors })`) doesn't accept a `snapshot` option. To restore a child from a persisted snapshot you must use `createActor(machine, { snapshot })` from inside a function-form `assign(({ context }) => …)`. The restored actor is its own root system — `stopChild` becomes `gameRef.stop()` and `systemId` is gone (works because we register the gameMachine's system via the appMachine's invoke).

---

## Phase / Competition Extension Patterns

### Pure phase functions

Sub-step logic lives as `(ctx: GameContext, params?) => GameContext` or `(draft: Draft<GameContext>, …) => void`. Trivially testable: `f(ctx) === expected`. Wire as `assign(({ context }, params) => phaseFn(context, params))`. **Don't try to extract whole `assign(…)` action objects to other files** — the XState generic juggling isn't worth it. Extract the work, keep the wiring in the machine file.

### Per-competition behavior on `CompetitionDefinition`

When `executeGameday` (or any future phase) needs per-competition logic, add an optional method to `CompetitionDefinition` in [src/types/competitions.ts](src/types/competitions.ts) instead of branching on `competitionId === "ehl"` inside the machine action.

Pattern:

```ts
groupEnd?: (
  draft: Draft<GameContext>,
  args: { phase: number; groupIdx: number; group: Group }
) => void;
```

Don't hide immer — competitions participate in the same `produce()` pass. EHL awards table + Finnish text live in [src/data/competitions/ehl.ts](src/data/competitions/ehl.ts), tournament prizes in [src/data/competitions/tournaments.ts](src/data/competitions/tournaments.ts). PHL/division omit the field. Default behavior is no-op via optional chaining (`competitionDef.groupEnd?.(…)`).

Same shape works for any future per-competition extension point: `groupEnd`, `afterMatch`, `start`/`end` lifecycle hooks. The machine layer stays competition-agnostic.

---

## Declarative Event / Prank Patterns

### `DeclarativeEvent<TData, TCreationData = BaseEventCreationFields>`

Second generic types the seed passed to `create`. Pranks pass their full `PrankInstance` shape; system events pass `{ manager: string }`.

### Three event archetypes

- **Pre-resolved** (e.g. `bazookaStrike`, `pirka`): `resolved: true` literal in payload, `create` does all the work, no `options`, no `resolve`. The walker still fires `process`.
- **Auto-resolve** (e.g. `sellNarcotics`, `protest`, `kasino`): `create` returns `resolved: false`, `resolve(ctx, data)` rolls + snapshots, no `options`. Walker resolves then processes in one entry pass.
- **Interactive** (e.g. `jaralahti`, `jobofferPHL`): `options: () => Record<key, label>`, `resolve(ctx, data, value)` snapshots the choice. Walker leaves `resolved: false` events alone; `RESOLVE_EVENT` from the user drives them.

### Random discipline (mandatory)

Every random roll happens in `resolve`. The result is snapshotted onto the payload (e.g. `skillLost`, `caught`, `success`). `process` is purely deterministic over `(ctx, data)`. Replaying `process` from a saved snapshot must reproduce the same effects; `process` runs after restore.

### `spawnEvent` EventEffect with injected `SpawnEventFn`

The effect interpreter (`applyEffects(draft, effects, spawn)`) takes a `SpawnEventFn = (draft, eventId, seed) => void` parameter. The machine layer owns the registry and provides the closure. Avoids circular imports.

### Pranks are declarative too

`DeclarativePrank.execute(ctx, prank) => EventEffect[]`. Most pranks return `[{ type: "spawnEvent", eventId, seed: prank }]`; `fixedMatch` returns a direct `addTeamEffect`. The prank-phase action loops `draft.prank.pranks`, calls `applyEffects` for each, then clears the queue.

### Two relevant machine inputs

- `RESOLVE_EVENT { id, value }` — interactive event resolution; component sends `gameActor.send({ type: "RESOLVE_EVENT", payload: { id, value } })`
- Auto-resolve happens on `event` state `entry`, no event needed

---

## Non-Negotiables for Agents

### 0. Raise concerns early

If something looks wrong, smells wrong, or might break something — say so immediately. Better to flag a false alarm than miss a real problem. Don't self-censor concerns to avoid slowing things down.

### 1. KISS

Always prefer the simpler solution. Simple ≠ easy — a well-designed simple solution often requires more thought than a complex one. Avoid over-engineering, unnecessary abstractions, premature generalization.

### 2. Behavior preservation

The game simulation logic is sensitive (calendar/event/phase sequencing). Avoid refactors that alter ordering, immutability semantics, or machine control flow unless explicitly required.

### 3. Small PR-sized changes

One concern per change set. Keep diffs reviewable.

### 4. No new legacy patterns

- No new class components.
- No reintroducing Immutable.js, Redux, redux-saga, or styled-components.
- Prefer named exports; default exports only when interop forces it.
- **Prefer non-mutating array methods:** `toSorted()` over `sort()`, `toReversed()` over `reverse()`, `toSpliced()` over `splice()`, `with()` over index assignment. Consistency matters more than micro-optimization.
- **Prefer logical/semantic CSS naming over physical:** when the choice exists, `inline` / `block` (and `inline-start` / `block-end` etc.) beat `top` / `right` / `bottom` / `left`. Same for design-system component props (`paddingInline`, not `paddingX` on a new API). Flexbox `row` / `column` are fine — they're flow-relative already.
- **Avoid global styling.** Bleeds across the whole app and creates spooky action at a distance. Reach for modern platform + library features that scope by context instead:
  - Vanilla Extract `selectors: { "tbody &": {...} }` for ancestor/sibling-conditional rules co-located with the variant they belong to — not `globalStyle`.
  - Prefer CSS nesting, `:has()`, `:is()`, container queries, `light-dark()`, logical properties — modern CSS removes most historical reasons to reach for a global rule.
  - `globalStyle` is reserved for genuine globals: element resets in [src/styles/global.css.ts](src/styles/global.css.ts), `:root` tokens, `@font-face`. Not for styling a third-party component or "just this one descendant".

### 5. State homes: machines/stores or `useState` — nothing in between

See "Architecture Overview" above. No React Context as a state layer.

### 6. Page / leaf boundary

See "Architecture Overview" above.

### 7. Type safety must trend upward

- New/edited modules are TypeScript.
- Add lightweight types around event payloads and selectors.
- Prefer `type` aliases by default; use `interface` only when declaration merging is explicitly needed.
- For React components, prefer `FC<Props>` where readable.
- `type-fest` is installed — use it freely (`Simplify`, `PartialDeep`, `SetRequired`, `Opaque`, …).
- `remeda` for `entries()`, `values()`, `keys()` (better key type preservation than native `Object.*`).

### 8. XState 5 conventions

See the dedicated section above.

---

## Working Rules

### Before coding

- Read the affected file(s) fully.
- Find neighboring usage sites before changing signatures.
- Verify whether code is unused before deleting.

### During coding

- **Never use `npm` or `npx`.** This is a **pnpm-only** project. Use `pnpm run <script>`, `pnpm exec <binary>`, `pnpm add <package>`. If you see a stray `package-lock.json`, delete it immediately.
- Prefer extensionless imports unless build requires explicit extension.
- Match existing style in each file; don't run mass formatting unrelated to the task.
- Keep user-visible Finnish strings unchanged unless explicitly requested.

### After coding

- Run the narrowest useful verification first, then broader checks.

### Maintain AGENTS.md

When you discover something new and durable (a pattern, a constraint, a non-obvious gotcha), update AGENTS.md. Keep entries concise and actionable. This document is shared institutional memory.

---

## Verification Checklist

```sh
pnpm verify      # tests + lint + format (writes fixes) + typecheck — the one-liner
pnpm typecheck   # tsgo --noEmit, ~0.3s, must be zero errors
pnpm test --run  # vitest, must be all green
pnpm build       # production build must succeed
pnpm dev         # local sanity check
```

For deterministic playtests: `VITE_RANDOM_SEED=42 pnpm dev` (same seed + same clicks = same game).

---

## High-Risk Areas

- [src/machines/game.ts](src/machines/game.ts) — phase sequencing, event walker, gameday execution
- [src/machines/end-of-season.ts](src/machines/end-of-season.ts) — promote/relegate, awards, season rollover
- [src/data/calendar.ts](src/data/calendar.ts) — 75-round calendar drives the entire phase loop (rounds 0–74; `endOfSeason` resets to 0)
- [src/services/persistence.ts](src/services/persistence.ts) — save/load uses `getPersistedSnapshot()` + `createActor({ snapshot })`. The blob is opaque JSON.
- Event/prank ports in [src/game/new-events/](src/game/new-events/) and [src/game/pranks.ts](src/game/pranks.ts) — random discipline must be obeyed (rolls in `resolve`, never in `process`)

When touching these areas:

- Preserve event/prank ids and snapshot shapes (loaded games depend on them).
- Verify save/load still works after any change to `GameContext` shape.

---

## Collaboration Style Preferences

- Be direct and honest. No sugarcoating, no performative politeness.
- Be respectful and non-malicious.
- Liberal coding humor is appreciated.
- For test/mock data, `Pier Paolo Pasolini` is the preferred recurring subject.
