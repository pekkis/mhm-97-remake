# mhm-97-remake

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
