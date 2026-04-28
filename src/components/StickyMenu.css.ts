import { style, globalStyle } from "@vanilla-extract/css";

export const container = style({
  backgroundColor: "rgb(133, 133, 133)",
  padding: "0.5em 0",
  color: "rgb(255, 255, 255)",
  position: "fixed",
  bottom: 0,
  right: 0,
  left: 0,
  display: "flex",
  flexBasis: "100%",
  zIndex: 1000
});

globalStyle(`${container} .secondary`, {
  flexShrink: 10,
  padding: "0 0.5em"
});

globalStyle(`${container} .advance`, {
  alignSelf: "flex-end",
  textAlign: "right",
  flexGrow: 3,
  padding: "0 0.5em"
});
