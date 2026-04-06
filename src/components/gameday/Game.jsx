import React from "react";
import styled from "styled-components";
import TeamName from "../team/Name";

const Row = styled.div`
  display: flex;
  flex-basis: 100%;
`;

const Team = styled.div`
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

const Game = (props) => {
  const { context, pairing, teams, managers } = props;
  return (
    <Row>
      <Team>
        <TeamName
          managers={managers}
          team={teams[context.teams[pairing.home]]}
        />
      </Team>
      <Separator>-</Separator>
      <Team>
        <TeamName
          managers={managers}
          team={teams[context.teams[pairing.away]]}
        />
      </Team>
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
