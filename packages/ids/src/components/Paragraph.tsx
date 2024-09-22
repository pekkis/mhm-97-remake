import { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
};

import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  p: {
    colorScheme: "inherit",
    // color: `light-dark(var(--gray-12), var(--gray-3))`,
    // backgroundColor: "transparent",
  },
});

export const Paragraph: FC<Props> = ({ children }) => {
  return <p {...stylex.props(styles.p)}>{children}</p>;
};
