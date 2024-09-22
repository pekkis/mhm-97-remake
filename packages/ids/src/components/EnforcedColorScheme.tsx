import { FC, ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  light: {
    colorScheme: "only light",
  },
  dark: {
    colorScheme: "only dark",
  },
});

type Props = {
  colorScheme: "light" | "dark";
  children: ReactNode;
};

export const EnforcedColorScheme: FC<Props> = ({ colorScheme, children }) => {
  return <div {...stylex.props(styles[colorScheme])}>{children}</div>;
};
