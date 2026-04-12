import { call } from "typed-redux-saga";
import { addEvent } from "@/sagas/event";
import type { MHMEvent } from "@/types/base";

const eventId = "cleandrug";

type CleandrugData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
};

const event: MHMEvent<CleandrugData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: true
    });
  },

  render: () => {
    return [`Kaikki pelaajasi olivat puhtaita huumausainetesteissä.`];
  },

  process: function* () {}
};

export default event;
