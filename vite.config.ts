import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import postcssImport from "postcss-import";
import postcssPresetEnv from "postcss-preset-env";
import postcssAdvancedVariables from "postcss-advanced-variables";
import postcssNested from "postcss-nested";

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()]
    })
  ],
  resolve: {
    tsconfigPaths: true
  },
  css: {
    postcss: {
      plugins: [
        postcssImport(),
        postcssPresetEnv({ browsers: "defaults" }),
        postcssAdvancedVariables(),
        postcssNested()
      ]
    }
  }
});
