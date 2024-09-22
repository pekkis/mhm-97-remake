import { FC, ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  light: {
    colorScheme: "light",
    color: `light-dark(var(--gray-12), var(--gray-0))`,
  },
  dark: {
    colorScheme: "dark",
    color: `light-dark(var(--gray-12), var(--gray-0))`,
  },
});

type Props = {
  colorScheme: "light" | "dark";
  children: ReactNode;
};

export const EnforcedColorScheme: FC<Props> = ({ colorScheme, children }) => {
  return <div {...stylex.props(styles[colorScheme])}>{children}</div>;
};
