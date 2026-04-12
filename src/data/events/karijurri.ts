import { call, select } from "typed-redux-saga";
import { addEvent } from "../../sagas/event";
import { addEffect } from "../../sagas/team";
import { managersTeam } from "@/selectors";
import type { MHMEvent } from "../../types/base";

const eventId = "karijurri";

type KarijurriData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: true;
  strength: number;
  duration: number;
};

const event: MHMEvent<KarijurriData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      strength: 15,
      resolved: true,
      duration: 6
    });
    return;
  },

  render: (data) => {
    return [
      `NHL on lakossa ${data.duration} ottelun ajan, ja __Kari Jurri__ saapuu Denveristä, Coloradosta, joukkueeseesi pitämään kuntoaan yllä!`
    ];
  },

  process: function* (data) {
    const manager = data.manager;
    const strength = data.strength;
    const duration = data.duration;
    const team = yield* select(managersTeam(manager));

    yield* call(addEffect, team.id, ["strength"], strength, duration);
  }
};

/*
IF yk > 0 THEN RETURN
PRINT "NHL on lakossa 6 ottelun ajan, ja Kari Jurri saapuu Denverist„,"
PRINT "Coloradosta, joukkueeseesi pit„m„„n kuntoaan yll„!"
tauti2 = -15
yk = 6
RETURN
*/

export default event;
