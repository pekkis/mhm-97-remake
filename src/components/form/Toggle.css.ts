import { style } from "@vanilla-extract/css";

export const toggle = style({
  position: "relative",
  display: "inline-block",
  width: "50px",
  height: "24px",
  verticalAlign: "middle"
});

export const input = style({
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  border: 0
});

export const track = style({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: "30px",
  backgroundColor: "#4d4d4d",
  transition: "background-color 0.2s ease",
  cursor: "pointer",
  selectors: {
    [`${input}:checked + &`]: {
      backgroundColor: "#19ab27"
    },
    [`${input}:disabled + &`]: {
      opacity: 0.5,
      cursor: "not-allowed"
    },
    [`${input}:focus-visible + &`]: {
      boxShadow: "0 0 2px 3px #0099e0"
    }
  },
  "::before": {
    content: '""',
    position: "absolute",
    top: "1px",
    left: "1px",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#fafafa",
    border: "1px solid #4d4d4d",
    transition: "all 0.25s ease"
  }
});

// Can't use ::before in selectors directly, so use globalStyle
import { globalStyle } from "@vanilla-extract/css";

globalStyle(`${input}:checked + ${track}::before`, {
  left: "27px",
  borderColor: "#19ab27"
});
