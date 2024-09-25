import { FC, ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";

type Props = {
  children: ReactNode;
};

const styles = stylex.create({
  main: {}
});

export const Main: FC<Props> = ({ children }) => {
  return <main {...stylex.props(styles.main)}>{children}</main>;
};
