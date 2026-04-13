import { createActor } from "xstate";
import { appMachine } from "./app";

export const appActor = createActor(appMachine);
appActor.start();
