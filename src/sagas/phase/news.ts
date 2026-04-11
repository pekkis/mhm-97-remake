import { take, call } from "typed-redux-saga";

import { setPhase } from "../game";
import { advance } from "../../ducks/game";

export default function* newsPhase() {
  yield* call(setPhase, "news");
  yield* take(advance);
}
