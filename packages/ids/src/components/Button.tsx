import { ComponentProps, FC } from "react";

import * as stylex from "@stylexjs/stylex";
import { colors } from "@stylexjs/open-props/lib/colors.stylex";
import { sizes } from "@stylexjs/open-props/lib/sizes.stylex";
// import { borders } from "@stylexjs/open-props/lib/borders.stylex";

const styles = stylex.create({
  button: {
    borderRadius: `var(--radius-2)`,
    borderWidth: `var(--border-size-1)`,
    borderStyle: "solid",
    borderColor: `light-dark(${colors.blue6}, ${colors.gray8})`,
    backgroundColor: `light-dark(${colors.blue4}, ${colors.gray7})`,
    paddingBlock: sizes.spacing2,
    paddingInline: sizes.spacing3,
    cursor: "pointer",
    color: `light-dark(${colors.gray12}, ${colors.gray3})`,

    ":not(:disabled):hover": {
      backgroundColor: `light-dark(${colors.blue5}, ${colors.gray6})`,
    },

    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },

  secondary: {
    borderColor: `light-dark(${colors.gray6}, ${colors.gray8})`,
    backgroundColor: `light-dark(${colors.gray4}, ${colors.gray7})`,
    ":not(:disabled):hover": {
      backgroundColor: `light-dark(${colors.gray5}, ${colors.gray6})`,
    },
  },

  block: {
    display: "block",
    width: "100%",
  },
});

type Props = ComponentProps<"button"> & {
  block?: boolean;
  secondary?: boolean;
  terse?: boolean;
};

export const Button: FC<Props> = ({
  block = false,
  secondary = false,
  terse = false,
  children,
  ...rest
}) => {
  return (
    <button
      {...rest}
      {...stylex.props(
        styles.button,
        block && styles.block,
        secondary && styles.secondary
      )}
    >
      {children}
    </button>
  );
};
