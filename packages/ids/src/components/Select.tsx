import { ComponentProps, FC } from "react";

import * as stylex from "@stylexjs/stylex";
import { colors } from "@stylexjs/open-props/lib/colors.stylex";
import { sizes } from "@stylexjs/open-props/lib/sizes.stylex";
import { borders } from "@stylexjs/open-props/lib/borders.stylex";

const styles = stylex.create({
  select: {
    backgroundColor: `light-dark(${colors.gray5}, ${colors.gray7})`,
    color: `light-dark(${colors.gray12}, ${colors.gray3})`,
    borderRadius: borders.radius3,
    borderStyle: "solid",
    borderWidth: `${borders.size1}`,
    borderColor: `light-dark(${colors.gray9}, ${colors.gray8})`,
    paddingBlock: sizes.spacing2,
    paddingInline: sizes.spacing3,
    cursor: "pointer",
  },
});

type Props = ComponentProps<"select">;

export const Select: FC<Props> = ({ children, ...rest }) => {
  return (
    <select {...rest} {...stylex.props(styles.select)}>
      {children}
    </select>
  );
};
