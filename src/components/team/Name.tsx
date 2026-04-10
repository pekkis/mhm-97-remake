import type { FC } from "react";
import styled from "styled-components";
import type { Team } from "../../ducks/game";
import type { Manager } from "../../ducks/manager";

type SpanProps = {
  $humanControlled: boolean;
};

const Span = styled.span<SpanProps>`
  ${(props) => props.$humanControlled && `font-weight: bold;`}
`;

type NameProps = {
  team: Team;
  managers?: Record<string, Manager>;
};

const Name: FC<NameProps> = ({ team, managers = {} }) => {
  const humanControlled = Object.values(managers).some(
    (p) => p.team === team.id,
  );

  return <Span $humanControlled={humanControlled}>{team.name}</Span>;
};

export default Name;
