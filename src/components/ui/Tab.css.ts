import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const tab = style({
  cursor: "pointer",
  backgroundColor: vars.color.surfaceMuted,
  listStylePosition: "inside",
  listStyleType: "none",
  margin: "0 0",
  padding: "0.5em 1em"
});

export const selected = style({
  fontWeight: vars.fontWeight.bold
});
