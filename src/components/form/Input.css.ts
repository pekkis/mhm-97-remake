import { style } from "@vanilla-extract/css";

export const input = style({
  border: "1px solid rgb(99, 99, 99)",
  borderRadius: "5px",
  padding: "0.5em",
  fontFamily: "inherit",
  selectors: {
    "&:disabled": {
      opacity: 0.5
    }
  }
});

export const block = style({
  width: "100%",
  display: "block"
});
