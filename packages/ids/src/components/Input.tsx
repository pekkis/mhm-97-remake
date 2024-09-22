import { ComponentProps, FC } from "react";

import * as stylex from "@stylexjs/stylex";
import { colors } from "@stylexjs/open-props/lib/colors.stylex";
import { sizes } from "@stylexjs/open-props/lib/sizes.stylex";
// import { borders } from "@stylexjs/open-props/lib/borders.stylex";

const styles = stylex.create({
  input: {
    borderRadius: `var(--radius-2)`,
    borderWidth: `var(--border-size-1)`,

    backgroundColor: `light-dark(${colors.gray5}, ${colors.gray7})`,
    color: `light-dark(${colors.gray12}, ${colors.gray3})`,
    borderStyle: "solid",
    borderColor: `light-dark(${colors.gray9}, ${colors.gray8})`,
    paddingBlock: sizes.spacing2,
    paddingInline: sizes.spacing3,
    cursor: "pointer",
  },
});

type Props = ComponentProps<"input">;

export const Input: FC<Props> = ({ ...rest }) => {
  return <input {...rest} {...stylex.props(styles.input)} />;
};
