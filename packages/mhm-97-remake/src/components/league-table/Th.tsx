import { ComponentProps, FC } from "react";
import * as stylex from "@stylexjs/stylex";

type Props = ComponentProps<"th"> & {
  sticky?: boolean;
};

import { colors } from "@stylexjs/open-props/lib/colors.stylex";
import { sizes } from "@stylexjs/open-props/lib/sizes.stylex";

const styles = stylex.create({
  th: {
    padding: sizes.spacing2
  },

  sticky: {
    position: "sticky",
    left: 0,
    backgroundColor: colors.gray0
  }
});

export const Th: FC<Props> = ({ children, sticky = false, ...rest }) => {
  return (
    <th {...rest} {...stylex.props(styles.th, sticky && styles.sticky)}>
      {children}
    </th>
  );
};
