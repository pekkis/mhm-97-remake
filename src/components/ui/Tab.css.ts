import { style } from "@vanilla-extract/css";

export const tab = style({
  cursor: "pointer",
  backgroundColor: "rgba(33, 33, 33, 0.3)",
  listStylePosition: "inside",
  listStyleType: "none",
  margin: "0 0",
  padding: "0.5em 1em"
});

export const selected = style({
  fontWeight: "bold"
});
