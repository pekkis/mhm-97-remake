import { defineConfig } from "vite";
import postcssImport from "postcss-import";
import postcssPresetEnv from "postcss-preset-env";
import postcssAdvancedVariables from "postcss-advanced-variables";
import postcssNested from "postcss-nested";

export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  css: {
    postcss: {
      plugins: [
        postcssImport(),
        postcssPresetEnv(),
        postcssAdvancedVariables(),
        postcssNested()
      ]
    }
  }
});
