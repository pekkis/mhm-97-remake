import { createActorContext } from "@xstate/react";
import { gameMachine } from "@/machines/game";

export const GameMachineContext = createActorContext(gameMachine);
