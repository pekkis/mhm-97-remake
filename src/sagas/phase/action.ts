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
import {
  managerCrisisMeeting,
  managerImproveArena,
  managerToggleService
} from "../../ducks/manager";
import { orderPrank as orderPrankAction } from "../../ducks/prank";
import { orderPrank as orderPrankSaga } from "../prank";
import { acceptInvitation } from "../invitation";

import { requestAcceptInvitation } from "../../ducks/invitation";
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
    takeEvery(managerCrisisMeeting, crisisMeeting),
    takeEvery(managerImproveArena, improveArena),
    takeEvery("META_GAME_SAVE_REQUEST" as any, gameSave),
    takeEvery(managerToggleService, toggleService),
    takeEvery(orderPrankAction, function* (action) {
      yield* call(orderPrankSaga, action);
    }),
    takeEvery(requestAcceptInvitation, function* (action) {
      yield* call(acceptInvitation, action.payload.manager, action.payload.id);
    }),
    takeEvery(requestBet, function* (action) {
      const {
        payload: { manager, coupon, amount }
      } = action;
      yield* call(bet, manager, coupon, amount);
    })
  ]);

  yield* take("GAME_ADVANCE_REQUEST");
  yield* cancel(tasks);
}
