import { FC, ReactNode } from "react";
import type { StyleXStyles } from "@stylexjs/stylex";
import * as stylex from "@stylexjs/stylex";

type Props = {
  children: ReactNode;
  p: 0 | 1 | 2 | 3 | 4;
  style?: StyleXStyles;
};

export const Box: FC<Props> = ({ children, style, ...rest }) => {
  console.log("BOX PROPS", rest);

  return <div {...stylex.props(style)}>{children}</div>;
};
