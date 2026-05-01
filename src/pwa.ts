import { registerSW } from "virtual:pwa-register";

// Auto-update SW: when a new version is available it activates immediately
// on the next navigation. We reload to pick up the new bundle.
export const registerServiceWorker = (): void => {
  if (import.meta.env.DEV) {
    return;
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) {
        return;
      }
      // Periodically check for updates while the app is open.
      const oneHour = 60 * 60 * 1000;
      setInterval(() => {
        void registration.update();
      }, oneHour);

      // Also check whenever the app is brought back to the foreground.
      // On installed PWAs (especially iOS) the interval doesn't fire while
      // backgrounded, so without this a user can sit on the previous build
      // for days. With autoUpdate + skipWaiting + clientsClaim, finding a
      // new SW reloads the page via the controllerchange listener.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          void registration.update();
        }
      });
    },
    onNeedRefresh() {
      // autoUpdate strategy will reload automatically; nothing to prompt.
    },
    onOfflineReady() {
      // Optional hook — could surface a toast here if desired.
    }
  });
};
