/// <reference types="vitest" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import stylex from "vite-plugin-stylex";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, isPreview, isSsrBuild }) => {
  console.log({
    command,
    mode,
    isPreview,
    isSsrBuild,
  });

  return {
    plugins: [
      stylex({
        unstable_moduleResolution: {
          type: "commonJS",
          rootDir: import.meta.dirname,
        },
      }),

      react({
        jsxRuntime: "automatic",
      }),
    ],
  };
});
