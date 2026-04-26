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

import type { DeclarativeEvent } from "@/types/event";
import type { BaseEventCreationFields, BaseEventFields } from "@/types/base";

// Pilot ports land here as we add them.

const newEvents = {} as const satisfies Record<
  string,
  DeclarativeEvent<BaseEventFields, BaseEventCreationFields>
>;

export default newEvents;
