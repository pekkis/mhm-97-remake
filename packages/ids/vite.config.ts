/// <reference types="vitest" />

import { resolve } from "path";
import externals from "rollup-plugin-node-externals";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";
import stylex from "vite-plugin-stylex";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    build: {
      lib: {
        entry: { ids: resolve(__dirname, "src/index.ts") },
        formats: ["es"],
      },
    },
    plugins: [
      command === "serve" &&
        stylex({
          unstable_moduleResolution: {
            type: "commonJS",
            rootDir: import.meta.dirname,
          },
        }),

      react({
        jsxRuntime: "automatic",
      }),
      dts({ tsconfigPath: "./tsconfig.app.json" }),
      externals({
        deps: true,
        devDeps: false,
      }),
    ],
    test: {
      globals: true,
      environment: "jsdom",
      reporters: ["verbose", "junit"],
      outputFile: {
        junit: "./junit.xml",
      },
    },
  };
});
