import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react"],
  env: {
    browser: true,
    node: true,
    es6: true
  },
  rules: {
    "no-empty-file": "off",
    "require-yield": "off",
    "no-unused-vars": "error",
    "no-constant-condition": "off",
    curly: "error"
  }
});
