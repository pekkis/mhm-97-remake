import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const notification = style({
  backgroundColor: vars.color.surfaceMuted,
  color: vars.color.text,
  padding: vars.space.md,
  cursor: "pointer"
});
