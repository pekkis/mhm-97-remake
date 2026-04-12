import { call } from "typed-redux-saga";
import { createInvitations } from "@/sagas/invitation";

export default function* invitationsCreatePhase() {
  yield* call(createInvitations);
}
