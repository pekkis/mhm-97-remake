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
import {
  crisisMeeting,
  toggleService,
  setActiveManager
} from "@/sagas/manager";
import { managerCrisisMeeting, managerToggleService } from "@/ducks/manager";
import { acceptInvitation } from "@/sagas/invitation";

import { requestAcceptInvitation } from "@/ducks/invitation";
import { advance, setGamePhase } from "@/ducks/game";
import type { RootState } from "@/config/redux";
import { values } from "remeda";

export default function* actionPhase() {
  const managers = yield* select((state: RootState) => state.manager.managers);

  yield* call(setActiveManager, values(managers)[0].id);

  yield* put(setGamePhase("action"));

  const task = yield* fork(function* () {
    yield* all([
      takeEvery(managerCrisisMeeting, crisisMeeting),
      takeEvery(managerToggleService, toggleService),
      takeEvery(requestAcceptInvitation, function* (action) {
        yield* call(
          acceptInvitation,
          action.payload.manager,
          action.payload.id
        );
      })
    ]);
  });

  yield* take(advance);
  yield* cancel(task);
}
