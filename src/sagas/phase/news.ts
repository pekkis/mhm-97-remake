import { take, call } from "typed-redux-saga";

import { advance } from "@/ducks/game";
import { setPhase } from "@/sagas/game";

export default function* newsPhase() {
  yield* call(setPhase, "news");
  yield* take(advance);
}
