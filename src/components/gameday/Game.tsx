import type { FC } from "react";
import styled from "styled-components";
import TeamName from "../team/Name";
import type { Team } from "../../ducks/game";
import type { Manager } from "../../ducks/manager";
import type { Group, Pairing } from "../../types/competitions";

const Row = styled.div`
  display: flex;
  flex-basis: 100%;
`;

const TeamDiv = styled.div`
  width: 50%;
  overflow: hidden;
`;

const Separator = styled.div`
  padding: 0 1em;
`;

const Result = styled.div`
  width: 50%;
  flex-shrink: 2;
  display: flex;
`;

const Score = styled.div``;

type GameProps = {
  context: Group;
  pairing: Pairing;
  teams: Team[];
  managers: Record<string, Manager>;
};

const Game: FC<GameProps> = ({ context, pairing, teams, managers }) => {
  return (
    <Row>
      <TeamDiv>
        <TeamName
          managers={managers}
          team={teams[context.teams[pairing.home]]}
        />
      </TeamDiv>
      <Separator>-</Separator>
      <TeamDiv>
        <TeamName
          managers={managers}
          team={teams[context.teams[pairing.away]]}
        />
      </TeamDiv>
      <Result>
        {pairing.result && (
          <>
            <Score>{pairing.result.home}</Score>
            <Separator>-</Separator>
            <Score>{pairing.result.away}</Score>
          </>
        )}
      </Result>
    </Row>
  );
};

export default Game;
