import { createActorContext } from "@xstate/react";
import { appMachine } from "@/machines/app";
import { inspector } from "@/stores/inspector";

export const AppMachineContext = createActorContext(appMachine, {
  id: "mhm97",
  inspect: inspector.inspect
});
