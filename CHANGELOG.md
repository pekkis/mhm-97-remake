# mhm-97-remake

## 2.1.3

### Patch Changes

- afe984d: Fix the "Kriisipalaveri" alert in the context-sensitive sidebar so it gates on effective morale (`getEffective(team).morale`) against `CRISIS_MORALE_MAX`, matching the menu link and the actual crisis-meeting availability. Previously the alert read raw `team.morale` against a hardcoded `-3`, so it could nag for a meeting whose link wasn't there — or stay silent when one was.
- afe984d: Unify crisis meeting gating: the `Current` context-sensitive panel now
  consumes the `canCrisisMeeting` selector instead of re-implementing its
  own check, and the selector now reads effective team morale (post team
  effects) so it matches the value the player sees on screen and the
  disabled state of the "Pidä kriisipalaveri" button.

## 2.1.2

### Patch Changes

- Check for service worker updates whenever the PWA is brought back to the foreground, not only on the hourly timer. Installed PWAs (especially on iOS) sit backgrounded for long stretches, so this makes new builds reach users faster.

## 2.1.1

### Patch Changes

- 2d6eb47: Pad the body with `env(safe-area-inset-*)` so iOS notch / Dynamic Island and Android cutouts no longer cover UI when installed as a PWA.

## 2.1.0

### Minor Changes

- Package the app as an installable PWA (iOS + Android). Adds
  `vite-plugin-pwa` with autoUpdate service worker, a web app manifest,
  Apple touch icon, and PWA-related `<meta>` tags.

### Patch Changes

- Fix theme switching being a no-op in production builds. Vite/Rolldown's
  default Lightning CSS minifier was transpiling `light-dark()` into a
  `prefers-color-scheme` media query plus space-toggle custom properties on
  `:root`, which ignored explicit `color-scheme` overrides set from JS.

  Switched `build.cssMinify` to `"esbuild"` and pinned evergreen-only
  `build.target` / `build.cssTarget` so modern CSS ships untranspiled.

  See: https://github.com/parcel-bundler/lightningcss/issues/873
