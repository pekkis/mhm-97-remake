import { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
};

import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  p: {},
});

export const Paragraph: FC<Props> = ({ children }) => {
  return <p {...stylex.props(styles.p)}>{children}</p>;
};
