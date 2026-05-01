import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import packageJson from "./package.json";

export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    react(),
    babel({
      presets: [reactCompilerPreset()]
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },

  resolve: {
    tsconfigPaths: true
  }
});
