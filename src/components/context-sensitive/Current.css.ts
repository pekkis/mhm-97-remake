import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const current = style({
  marginBottom: vars.space.md
});

export const currentEntry = style({
  padding: vars.space.sm,
  borderWidth: vars.borderWidth.thin,
  borderStyle: "dotted",
  borderColor: vars.color.border
});
