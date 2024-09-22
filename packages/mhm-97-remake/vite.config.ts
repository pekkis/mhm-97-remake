import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import stylex from "vite-plugin-stylex";
import browserslist from "browserslist";
import { browserslistToTargets } from "lightningcss";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    stylex({
      unstable_moduleResolution: {
        type: "commonJS",
        rootDir: import.meta.dirname
      }
    })
  ],

  css: {
    transformer: "lightningcss",
    lightningcss: {
      errorRecovery: false,
      targets: browserslistToTargets(browserslist(">= 0.25%"))
    }
  },

  build: {
    cssMinify: "lightningcss"
  }
});
