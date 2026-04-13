import { uiStore } from "./ui";
import { countryStore } from "./country";
import { notificationStore } from "./notification";
import { appActor } from "@/machines/actors";
import type { GameActor } from "@/machines/actors";
import type { InspectionEvent } from "xstate";
import type { Observer } from "xstate";

/**
 * The inspector's `inspect` observer, captured once for reuse when
 * dynamically created actors (like gameMachine) need to be registered.
 */
let inspectFn:
  | Observer<InspectionEvent>
  | ((event: InspectionEvent) => void)
  | undefined;

export const connectInspector = async () => {
  if (import.meta.env.PROD) {
    return;
  }

  const { createBrowserInspector } = await import("@statelyai/inspect");
  const { inspect } = createBrowserInspector({
    autoStart: true
  });

  inspectFn = inspect;

  // The inspector reads actorRef.id for the display name (falls back to "anonymous").
  // Not part of @xstate/store's public config API, but a writable property on the store.
  Object.assign(uiStore, { id: "ui" });
  Object.assign(countryStore, { id: "country" });
  Object.assign(notificationStore, { id: "notification" });

  uiStore.inspect(inspect);
  countryStore.inspect(inspect);
  notificationStore.inspect(inspect);

  // appActor already has id "app" from the machine definition.
  // Machine actors expose inspect via their system, not directly on the actor.
  appActor.system.inspect(inspect);
};

/**
 * Register a dynamically created game actor with the Stately Inspector.
 *
 * Called from the sync middleware when a game actor is started.
 * No-op in production or if the inspector hasn't been initialized.
 */
export const inspectGameActor = (actor: GameActor) => {
  if (!inspectFn) {
    return;
  }
  actor.system.inspect(inspectFn);
};
