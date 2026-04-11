import { createGlobalTheme } from "@vanilla-extract/css";

export const vars = createGlobalTheme(":root", {
  color: {
    black: "rgb(0, 0, 0)",
    white: "rgb(255, 255, 255)",
    blue: "#007ce0",
    navy: "#004175",
    red: "rgb(255, 0, 0)",
    bar: "rgb(225, 225, 225)"
  },
  space: {
    "0": "0",
    "1": "1em",
    "2": "2em",
    "3": "3em"
  }
});
