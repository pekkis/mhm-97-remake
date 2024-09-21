import * as stylex from "@stylexjs/stylex";
import { colors as ocolors } from "@stylexjs/open-props/lib/colors.stylex";

export const colors = stylex.defineVars({
  primaryText: "light-dark(black, white)",
  secondaryText: "#333",
  accent: "blue",
  background: "light-dark(white, black)",
  lineColor: "gray",
  borderRadius: "4px",
  fontFamily: "system-ui, sans-serif",
  fontSize: "16px"
});
