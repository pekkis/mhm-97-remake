import styled from "styled-components";
import type { SpaceProps, ColorProps, WidthProps } from "styled-system";
import { color, space, width } from "styled-system";

type BoxProps = SpaceProps & WidthProps & ColorProps;

const Box = styled.div<BoxProps>`
  ${space}
  ${width}
  ${color}
`;

Box.displayName = "Box";

export default Box;
