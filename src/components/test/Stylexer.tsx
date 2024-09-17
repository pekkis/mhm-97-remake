import { FC } from "react";
import * as stylex from "@stylexjs/stylex";
import { tokens } from "../../stylex/tokens.stylex";

const styles = stylex.create({
  rubals: {
    colorScheme: "dark only"
  },

  container: {
    display: "block",
    backgroundColor: "light-dark(rgb(255 255 255), rgb(0 0 0))",
    color: "light-dark(rgb(0 0 0), rgb(255 255 255))"
  }
});

const Stylexer: FC = () => {
  return (
    <div {...stylex.props(styles.rubals)}>
      <div {...stylex.props(styles.container)}>stylexer!</div>
    </div>
  );
};

export default Stylexer;
