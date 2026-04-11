import { style } from "@vanilla-extract/css";

export const row = style({
  display: "flex",
  flexBasis: "100%"
});

export const teamDiv = style({
  width: "50%",
  overflow: "hidden"
});

export const separator = style({
  padding: "0 1em"
});

export const result = style({
  width: "50%",
  flexShrink: 2,
  display: "flex"
});
