/**
 * `GameContext` — the canonical shape of the game's full state.
 *
 * Lives in `@/state` so it can be consumed equally by the XState machines
 * (where it is `gameMachine.context`) and any remaining Redux/legacy code
 * during the transition.
 */

import type { GameState } from "./game";
import type { ManagerState } from "./manager";
import type { EventState } from "./event";
import type { InvitationState } from "./invitation";
import type { NewsState } from "./news";
import type { NotificationState } from "./notification";
import type { StatsState } from "./stats";
import type { CountryState } from "./country";
import type { PrankState } from "./prank";
import type { ActorRefFrom } from "xstate";
import type { betMachine } from "@/machines/bet";
import type { championBetMachine } from "@/machines/championBet";

export type GameContext = GameState & {
  manager: ManagerState;
  event: EventState;
  news: NewsState;
  notification: NotificationState;
  prank: PrankState;
  stats: StatsState;
  invitation: InvitationState;
  country: CountryState;
  /**
   * Active parlay bet actors. Each is spawned by `gameMachine` on
   * `PLACE_BET`, parked in `placed` until the league round runs in
   * `executeGameday`, then resolved — their `BET_RESOLVED` output
   * is interpreted by the parent. Cleared at the round boundary by
   * `advanceRound` (matches the deleted Redux `nextTurn` clear).
   */
  parlayBets: ActorRefFrom<typeof betMachine>[];
  /**
   * Active championship bet actors. Each is spawned by `gameMachine`
   * on `PLACE_CHAMPION_BET`, parked in `placed` until end-of-season
   * (when the champion is decided), then resolved — their
   * `BET_RESOLVED` output is interpreted by the parent. Cleared at
   * the season boundary (TODO: when end_of_season migrates).
   */
  championBets: ActorRefFrom<typeof championBetMachine>[];
};
