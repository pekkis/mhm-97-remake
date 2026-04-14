import { call } from "typed-redux-saga";
import { waitFor } from "xstate";

import { setPhase } from "@/sagas/game";
import { getGameActor } from "@/machines/actors";

export default function* newsPhase() {
  yield* call(setPhase, "news");

  // The gameMachine is in `executingPhases` with currentPhase === "news".
  // It waits for the user's ADVANCE event (bridged from the Redux advance()
  // action by the sync middleware). When the user clicks advance, the machine
  // transitions to the next phase. We wait for that transition here.
  const actor = getGameActor()!;
  yield* call(() =>
    waitFor(actor, (snap) => snap.context.currentPhase !== "news"),
  );
}
