import { defineConfig } from "oxlint";

export default defineConfig({
  env: {
    browser: true,
    node: true,
    es6: true
  },
  rules: {
    "no-empty-file": "off",
    "require-yield": "off",
    "no-unused-vars": "warn",
    "no-constant-condition": "off"
  }
});
