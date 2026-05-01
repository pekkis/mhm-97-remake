import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    react(),
    babel({
      presets: [reactCompilerPreset()]
    }),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: [
        "favicon.png",
        "robots.txt",
        "humans.txt",
        "icons/apple-touch-icon.png"
      ],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff,woff2,ttf}"],
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api\//]
      },
      devOptions: {
        enabled: false
      },
      manifest: {
        name: "MHM 97",
        short_name: "MHM 97",
        description: "A remake of MHM 97",
        lang: "fi",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#000000",
        theme_color: "#000000",
        categories: ["games", "sports", "entertainment"],
        icons: [
          {
            src: "/icons/mhm97-48.png",
            sizes: "48x48",
            type: "image/png"
          },
          {
            src: "/icons/mhm97-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/mhm97-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/mhm97-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icons/mhm97-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },

  build: {
    // Evergreen-only: ship modern syntax, skip transpilation for
    // anything older. Update these as the floor moves.
    target: ["chrome135", "edge135", "firefox135", "safari18"],
    cssTarget: ["chrome135", "edge135", "firefox135", "safari18"],
    // Use esbuild for CSS minification. Vite/Rolldown defaults to
    // Lightning CSS, which transpiles `light-dark()` into a
    // `prefers-color-scheme` media query plus space-toggle custom
    // properties on `:root`. The transpiled form ignores explicit
    // `color-scheme` overrides set by JS, silently breaking our
    // manual theme switch in production.
    // See: https://github.com/parcel-bundler/lightningcss/issues/873
    cssMinify: "esbuild"
  },

  resolve: {
    tsconfigPaths: true
  }
});
