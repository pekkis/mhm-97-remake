import { style, globalStyle } from "@vanilla-extract/css";
import { tab } from "./Tab.css";

export const tabs = style({
  backgroundColor: "rgba(255, 255, 255)"
});

export const tabsList = style({
  backgroundColor: "rgba(33, 33, 33, 0.3)",
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
