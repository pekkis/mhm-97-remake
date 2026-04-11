import { style, globalStyle } from "@vanilla-extract/css";
import { button } from "./Button.css";

export const buttonRow = style({
  margin: "1em 0"
});

globalStyle(`${buttonRow} ${button} + ${button}`, {
  marginLeft: "1em"
});
