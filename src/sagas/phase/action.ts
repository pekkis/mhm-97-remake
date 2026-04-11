import {
  call,
  fork,
  all,
  take,
  takeEvery,
  cancel,
  put,
  select
} from "typed-redux-saga";
import { gameSave } from "../meta";
import {
  watchTransferMarket,
  crisisMeeting,
  improveArena,
  toggleService,
  setActiveManager
} from "../manager";
import { orderPrank } from "../prank";
import { acceptInvitation } from "../invitation";

import { INVITATION_ACCEPT_REQUEST } from "../../ducks/invitation";
import { requestBet } from "../../ducks/betting";
import { bet } from "../betting";
import { setGamePhase } from "../../ducks/game";
import type { RootState } from "../../config/redux";

export default function* actionPhase() {
  const managers = yield* select((state: RootState) => state.manager.managers);

  yield* call(setActiveManager, Object.values(managers)[0].id);

  yield* put(setGamePhase("action"));

  const tasks = yield* all([
    fork(watchTransferMarket),
    takeEvery("MANAGER_CRISIS_MEETING" as any, crisisMeeting),
    takeEvery("MANAGER_IMPROVE_ARENA" as any, improveArena),
    takeEvery("META_GAME_SAVE_REQUEST" as any, gameSave),
    takeEvery("MANAGER_TOGGLE_SERVICE" as any, toggleService),
    takeEvery("PRANK_ORDER" as any, orderPrank),
    takeEvery(INVITATION_ACCEPT_REQUEST as any, function* (action: any) {
      yield* call(acceptInvitation, action.payload.manager, action.payload.id);
    }),
    takeEvery(requestBet, function* (action: any) {
      const {
        payload: { manager, coupon, amount }
      } = action;
      yield* call(bet, manager, coupon, amount);
    })
  ]);

  yield* take("GAME_ADVANCE_REQUEST");
  yield* cancel(tasks);
}
