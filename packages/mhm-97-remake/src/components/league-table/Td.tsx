import { ComponentProps, FC } from "react";
import * as stylex from "@stylexjs/stylex";

import { colors } from "@stylexjs/open-props/lib/colors.stylex";
import { sizes } from "@stylexjs/open-props/lib/sizes.stylex";

const styles = stylex.create({
  td: {
    padding: sizes.spacing2
  },
  sticky: {
    position: "sticky",
    left: 0,
    backgroundColor: colors.gray0
  }
});

type Props = ComponentProps<"td"> & {
  sticky?: boolean;
};

export const Td: FC<Props> = ({ children, sticky = false, ...rest }) => {
  return (
    <td {...rest} {...stylex.props(styles.td, sticky && styles.sticky)}>
      {children}
    </td>
  );
};
