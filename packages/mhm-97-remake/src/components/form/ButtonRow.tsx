import styled from "styled-components";
import Button from "./Button";
import { FC, ReactNode } from "react";

import * as stylex from "@stylexjs/stylex";
import { sizes } from "@stylexjs/open-props/lib/sizes.stylex";

const styles = stylex.create({
  buttonRow: {
    marginBlock: sizes.spacing4,
    display: "flex",
    justifyContent: "center",
    gap: sizes.spacing4
  }
});

type Props = {
  children: ReactNode;
};

const ButtonRow: FC<Props> = ({ children }) => {
  return <div {...stylex.props(styles.buttonRow)}>{children}</div>;
};

/*
const ButtonRow = styled.div`
  margin: 1em 0;

  ${Button} + ${Button} {
    margin-left: 1em;
  }
`;
*/

export default ButtonRow;
