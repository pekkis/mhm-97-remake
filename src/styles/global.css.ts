import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

globalStyle("html", {
  backgroundColor: vars.color.white,
  color: vars.color.black
});

globalStyle("body", {
  padding: 0
});

globalStyle("form", {
  margin: 0,
  padding: 0
});

globalStyle("p", {
  margin: "1em 0"
});
