import { ComponentProps, FC } from "react";
import { colors } from "@stylexjs/open-props/lib/colors.stylex";
import { sizes } from "@stylexjs/open-props/lib/sizes.stylex";
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  tr: {}
});

type Props = ComponentProps<"tr"> & {};

export const Tr: FC<Props> = ({ children, ...rest }) => {
  return <tr {...rest}>{children}</tr>;
};
