import { call } from "typed-redux-saga";
import { createInvitations } from "../invitation";

export default function* invitationsCreatePhase() {
  yield* call(createInvitations);
}
