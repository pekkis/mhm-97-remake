import { style, globalStyle } from "@vanilla-extract/css";
import { button } from "../form/Button.css";

export const buttonContainer = style({});

globalStyle(`${buttonContainer} ${button}`, {
  margin: "1em 0"
});
