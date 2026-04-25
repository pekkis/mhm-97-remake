import { createActor } from "xstate";
import { appMachine } from "@/machines/app";

export const appActor = createActor(appMachine);
appActor.start();
