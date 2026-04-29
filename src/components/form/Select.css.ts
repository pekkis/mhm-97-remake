import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const select = style({
  borderWidth: vars.borderWidth.thin,
  borderStyle: "solid",
  borderColor: vars.color.border,
  borderRadius: vars.radius.sm,
  padding: "0.5em",
  fontFamily: "inherit",
  color: vars.color.text,
  backgroundColor: vars.color.surfaceRaised,
  selectors: {
    "&:disabled": {
      opacity: 0.5
    }
  }
});

export const block = style({
  inlineSize: "100%",
  display: "block"
});
