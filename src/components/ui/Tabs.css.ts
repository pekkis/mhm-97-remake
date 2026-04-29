import { style, globalStyle } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";
import { tab } from "./Tab.css";

export const tabs = style({
  backgroundColor: vars.color.surface
});

export const tabsList = style({
  backgroundColor: vars.color.surfaceMuted,
  padding: "1em",
  display: "flex",
  flexBasis: "100%",
  flexWrap: "wrap",
  alignItems: "center",
  alignContent: "stretch",
  listStylePosition: "inside",
  listStyleType: "none",
  margin: "1em 0"
});

globalStyle(`${tabsList} ${tab} + ${tab}`, {
  marginLeft: "1em"
});

export const tabContent = style({
  padding: 0
});
