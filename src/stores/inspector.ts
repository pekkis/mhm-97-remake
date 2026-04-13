import { uiStore } from "./ui";
import { countryStore } from "./country";
import { notificationStore } from "./notification";
import { appActor } from "@/machines/actors";

export const connectInspector = async () => {
  if (import.meta.env.PROD) {
    return;
  }

  const { createBrowserInspector } = await import("@statelyai/inspect");
  const { inspect } = createBrowserInspector({
    autoStart: true
  });

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
