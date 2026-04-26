import { createActorRefContext } from "@/lib/createActorRefContext";
import { gameMachine } from "@/machines/game";

export const GameMachineContext = createActorRefContext(gameMachine);
