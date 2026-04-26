/**
 * Parallel registry for the new declarative event system.
 *
 * Files are ported one-by-one from `@/game/events/`. Once an event
 * lands here, the machine's event interpreter prefers this registry
 * over the legacy one. When all 96 events are ported, the legacy
 * `@/game/events/` directory and the saga-based event helpers will
 * be deleted.
 *
 * Add new ports to this object as they're written.
 */

import pirka from "./pirka";
import jaralahti from "./jaralahti";
import jobofferPHL from "./joboffer-phl";
import kasino from "./kasino";
import bloodbath from "./bloodbath";
import russianAgent from "./russian-agent";
import bazookaStrike from "./bazooka-strike";
import sellNarcotics from "./sell-narcotics";
import protest from "./protest";

// Pilot ports land here as we add them.
//
// Intentionally typed via `as const` (no `satisfies Record<…, DeclarativeEvent<…>>`):
// `DeclarativeEvent` is contravariant in `TData` because of `render(data: TData)`,
// so a heterogeneous registry can't be widened to a single base type without
// losing per-event payload typing at lookup sites. Mirrors the legacy
// `src/game/events.ts` pattern.

const newEvents = {
  pirka,
  jaralahti,
  jobofferPHL,
  kasino,
  bloodbath,
  russianAgent,
  bazookaStrike,
  sellNarcotics,
  protest
} as const;

export default newEvents;
