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

---

## Non-Negotiables for Agents

1. **Vite-first only**
   - Do not reintroduce Webpack config, plugins, or assumptions.
   - If legacy webpack references remain in deps/config, treat them as cleanup candidates.

2. **Behavior preservation over stylistic churn**
   - The game simulation logic is sensitive (calendar/event/phase sequencing).
   - Avoid refactors that alter ordering, immutability semantics, or saga control flow unless explicitly required.

3. **Small PR-sized changes**
   - One concern per change set (e.g., router fixes, markdown API, one saga area, one reducer area).
   - Keep diffs reviewable.

4. **No new legacy patterns**
   - Do not add new class components unless absolutely required.
   - Do not add new Immutable-heavy APIs in fresh code; prefer typed plain objects for new modules.
   - Prefer named exports; avoid default exports for new/edited modules unless interop absolutely requires it.

5. **Type safety must trend upward**
   - New/edited modules should be TypeScript where feasible.
   - Add lightweight types around action payloads/selectors touched by a change.
   - Prefer `type` aliases by default; use `interface` only when declaration merging/extension semantics are explicitly needed.
   - For React components, prefer the `FC<Props>` typing style where practical and readable.

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
3. For TypeScript-touched changes, run `pnpm exec tsc --noEmit`.
4. For API migrations, grep for old patterns to ensure full removal.

If one check is known-broken for unrelated reasons, state that explicitly and still run all applicable checks.

---

## Immediate Backlog Suggestions

1. Update `README.md` to current install/run commands (`pnpm` + `vite`).
2. Inventory and remove webpack-only dependencies/config that are now dead.
3. Add scripts for lint/typecheck/test so modernization has consistent gates.
4. Add a small regression suite around:
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
