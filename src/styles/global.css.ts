import "normalize.css";
import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

globalStyle("html", {
  backgroundColor: vars.color.white,
  color: vars.color.black,
  fontSize: "16px",
  lineHeight: 1.45,
  fontFamily: "'Maven Pro', sans-serif",
});

globalStyle("h1", {
  fontSize: "2.25rem",
});

globalStyle("h2", {
  fontSize: "1.5rem",
});

globalStyle("h3", {
  fontSize: "1rem",
});

globalStyle("h1, h2, h3, h4, h5, h6", {
  lineHeight: 1.1,
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
