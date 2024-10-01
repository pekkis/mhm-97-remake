import { ComponentProps, FC, ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";

import { colors } from "@stylexjs/open-props/lib/colors.stylex";
import { sizes } from "@stylexjs/open-props/lib/sizes.stylex";

const styles = stylex.create({
  container: {
    maxWidth: "100cqw",
    overflowX: "scroll"
  }
});

type Props = {
  children: ReactNode;
};

export const TableContainer: FC<Props> = ({ children }) => {
  return <div {...stylex.props(styles.container)}>{children}</div>;
};
