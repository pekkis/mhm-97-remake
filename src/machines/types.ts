/**
 * XState GameContext — the unified game state type.
 *
 * This is the shape that `gameMachine.context` will hold once the XState
 * migration is complete. It is the union of all current Redux duck state
 * shapes, flattened into a single object.
 *
 * During the migration this type is used for:
 *   - Typing context-aware selectors (`src/machines/selectors.ts`)
 *   - Typing event commands (`src/machines/commands.ts`)
 *   - Gradually replacing `RootState` in new code
 *
 * The type intentionally re-exports constituent types from their current
 * homes so that a single import gives access to the full vocabulary.
 */

// --- Re-exports from ducks/types (canonical locations) ---

export type {
  Team,
  TeamEffect,
  GameFlags,
  WorldChampionshipEntry
} from "@/ducks/game";
export type {
  Manager,
  ManagerArena,
  ManagerServices,
  ManagerState
} from "@/ducks/manager";
export type { BettingState, Bet, ChampionshipBet } from "@/ducks/betting";
export type { EventState, StoredEvent } from "@/ducks/event";
export type { InvitationState, Invitation } from "@/ducks/invitation";
export type { MetaState, MetaManager } from "@/ducks/meta";
export type { NewsState } from "@/ducks/news";
export type { NotificationState, Notification } from "@/ducks/notification";
export type {
  StatsState,
  SeasonStats,
  Streak,
  GameRecord
} from "@/ducks/stats";
export type { UiState } from "@/ducks/ui";
export type { Country, CountryState } from "@/ducks/country";
export type { PrankState } from "@/ducks/prank";
export type { PrankInstance } from "@/game/pranks";
export type { ManagerDefinition } from "@/data/managers";

export type {
  Competition,
  CompetitionId,
  Phase,
  Group,
  RoundRobinGroup,
  TournamentGroup,
  PlayoffGroup,
  Pairing,
  GameResult,
  TeamStat,
  MatchupStat,
  MatchupTeamStat,
  Penalty
} from "@/types/competitions";

// --- GameContext ---

import type { Team, GameFlags, WorldChampionshipEntry } from "@/ducks/game";
import type { ManagerState } from "@/ducks/manager";
import type { BettingState } from "@/ducks/betting";
import type { EventState } from "@/ducks/event";
import type { InvitationState } from "@/ducks/invitation";
import type { NewsState } from "@/ducks/news";
import type { NotificationState } from "@/ducks/notification";
import type { StatsState } from "@/ducks/stats";
import type { CountryState } from "@/ducks/country";
import type { PrankState } from "@/ducks/prank";
import type { ManagerDefinition } from "@/data/managers";
import type { Competition, CompetitionId } from "@/types/competitions";

/**
 * The full game context that will live inside `gameMachine`.
 *
 * This mirrors the current Redux store shape (`RootState`) but is
 * structured as a flat context object rather than nested reducer slices.
 * The `meta` and `ui` slices are excluded — `meta` becomes `appMachine`
 * state, and `ui` becomes an `@xstate/store` instance.
 */
export type GameContext = {
  // --- From game duck ---
  turn: { season: number; round: number; phase: string | undefined };
  flags: GameFlags;
  serviceBasePrices: Record<string, number>;
  /** NPC manager definitions (array indexed by id) */
  managers: ManagerDefinition[];
  competitions: Record<CompetitionId, Competition>;
  teams: Team[];
  worldChampionshipResults: WorldChampionshipEntry[] | undefined;

  // --- From manager duck ---
  manager: ManagerState;

  // --- From betting duck ---
  betting: BettingState;

  // --- From event duck ---
  event: EventState;

  // --- From news duck ---
  news: NewsState;

  // --- From notification duck ---
  notification: NotificationState;

  // --- From prank duck ---
  prank: PrankState;

  // --- From stats duck ---
  stats: StatsState;

  // --- From invitation duck ---
  invitation: InvitationState;

  // --- From country duck ---
  country: CountryState;
};
