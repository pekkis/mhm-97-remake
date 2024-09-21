import { ComponentProps, FC } from "react";

type Props = ComponentProps<"button">;

import * as stylex from "@stylexjs/stylex";
import { colors } from "@stylexjs/open-props/lib/colors.stylex";
import { sizes } from "@stylexjs/open-props/lib/sizes.stylex";
import { borders } from "@stylexjs/open-props/lib/borders.stylex";

const styles = stylex.create({
  button: {
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

export const Button: FC<Props> = ({ children, ...rest }) => {
  return (
    <button {...rest} {...stylex.props(styles.button)}>
      {children}
    </button>
  );
};
