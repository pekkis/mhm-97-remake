import { call } from "typed-redux-saga";
import { seasonStart } from "@/sagas/game";

export default function* startOfSeasonPhase() {
  yield* call(seasonStart);
}
