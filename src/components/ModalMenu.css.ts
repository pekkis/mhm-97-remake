import { style, globalStyle } from "@vanilla-extract/css";

export const menuContainer = style({
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  bottom: 0,
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  zIndex: 100000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1em"
});

export const menuContents = style({
  backgroundColor: "rgb(0, 0, 0)",
  padding: "1em",
  color: "rgb(255, 255, 255)",
  width: "100%",
  borderRadius: "1em"
});

globalStyle(
  `${menuContents} a:link, ${menuContents} a:hover, ${menuContents} a:visited`,
  {
    color: "rgb(255, 255, 255)"
  }
);

globalStyle(`${menuContents} ul`, {
  display: "block",
  listStyleType: "none",
  listStylePosition: "inside",
  margin: 0,
  padding: 0,
  textAlign: "center"
});

globalStyle(`${menuContents} ul li`, {
  margin: 0,
  padding: "0.5em 0"
});
