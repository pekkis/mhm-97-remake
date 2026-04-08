import React from "react";
import styled from "styled-components";

const Span = styled.span`
  ${(props) => props.humanControlled && `font-weight: bold;`}
`;

const Name = (props) => {
  const { team, managers = {} } = props;

  console.log({ team, managers });

  const humanControlled = Object.values(managers).some(
    (p) => p.team === team.id
  );

  return <Span humanControlled={humanControlled}>{team.name}</Span>;
};

export default Name;
