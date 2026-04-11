import { style, globalStyle } from "@vanilla-extract/css";

export const button = style({
  border: "1px solid rgb(99, 99, 99)",
  borderRadius: "5px",
  padding: "1em 1.5em",
  fontFamily: "inherit",
  backgroundColor: "rgb(200, 200, 200)",
  boxShadow: "0 3px rgba(0, 0, 0, 0.25)",
  outline: "none",
  selectors: {
    "&:hover": {
      backgroundColor: "rgb(180, 180, 180)",
      cursor: "pointer"
    },
    "&:active": {
      boxShadow: "0 1px rgba(0, 0, 0, 0.25)",
      transform: "translateY(2px)"
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed"
    },
    "&:disabled:active": {
      boxShadow: "0 3px rgba(0, 0, 0, 0.25)",
      transform: "none"
    }
  }
});

export const secondary = style({
  backgroundColor: "rgb(255, 255, 255)",
  selectors: {
    "&:hover": {
      backgroundColor: "rgb(250, 250, 250)"
    }
  }
});

export const terse = style({
  padding: "1em"
});

export const block = style({
  width: "100%",
  display: "block"
});

globalStyle(`${button} + ${button}`, {
  marginLeft: "1em"
});
