import { style, globalStyle } from "@vanilla-extract/css";

export const tableScroller = style({
  position: "relative",
  maxWidth: "600px",
  overflow: "hidden",
  border: "none"
});

globalStyle(`${tableScroller} table`, {
  width: "100%",
  margin: "auto",
  borderCollapse: "separate",
  borderSpacing: "0"
});

globalStyle(`${tableScroller} th`, {
  backgroundColor: "rgb(255, 255, 255)"
});

globalStyle(`${tableScroller} th, ${tableScroller} td`, {
  padding: "0.25em 0.5em",
  border: "none",
  whiteSpace: "nowrap",
  verticalAlign: "top"
});

globalStyle(`${tableScroller} thead, ${tableScroller} tfoot`, {
  background: "#f9f9f9"
});

globalStyle(`${tableScroller} .clone`, {
  position: "absolute",
  top: 0,
  left: 0,
  pointerEvents: "none"
});

globalStyle(`${tableScroller} .clone th, ${tableScroller} .clone td`, {
  visibility: "hidden"
});

globalStyle(`${tableScroller} .clone td, ${tableScroller} .clone th`, {
  borderColor: "transparent"
});

globalStyle(`${tableScroller} .clone tbody th`, {
  visibility: "visible",
  color: "red"
});

globalStyle(`${tableScroller} .clone .fixed`, {
  border: "none",
  visibility: "visible"
});

globalStyle(`${tableScroller} .clone thead, ${tableScroller} .clone tfoot`, {
  background: "transparent"
});

export const tableWrapper = style({
  width: "100%",
  overflow: "auto"
});
