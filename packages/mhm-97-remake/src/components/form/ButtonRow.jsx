import styled from "styled-components";
import Button from "./Button";

const ButtonRow = styled.div`
  margin: 1em 0;

  ${Button} + ${Button} {
    margin-left: 1em;
  }
`;

export default ButtonRow;
