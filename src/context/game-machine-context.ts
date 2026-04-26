import { createActorContext } from "@xstate/react";
import { gameMachine } from "@/machines/game";
import { inspector } from "@/stores/inspector";

export const GameMachineContext = createActorContext(gameMachine, {
  id: "mhm97",
  inspect: inspector.inspect
});
