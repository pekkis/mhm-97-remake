import { style, globalStyle } from "@vanilla-extract/css";

export const startMenu = style({
  margin: "0 auto",
  maxWidth: "600px"
});

globalStyle(`${startMenu} p`, {
  margin: "1em 0"
});

export const titleImg = style({
  maxWidth: "100%",
  display: "block"
});

export const centerer = style({
  textAlign: "center"
});

export const contents = style({});

globalStyle(`${contents} h1`, {
  margin: 0
});

globalStyle(`${contents} h2`, {
  margin: 0,
  fontSize: "1em"
});
