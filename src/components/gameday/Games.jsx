import React from "react";

import competitionTypes from "../../services/competition-type";

import Game from "./Game";
import Box from "../styled-system/Box";

const Games = (props) => {
  const { className, teams, context, round, managers } = props;

  const playMatch = competitionTypes[context.type].playMatch;
  const pairings = (context.schedule[round] ?? []).filter((p, i) => {
    return playMatch(context, round, i);
  });

  return (
    <Box my={1}>
      {pairings.map((pairing, i) => {
        return (
          <Game
            key={i}
            context={context}
            pairing={pairing}
            teams={teams}
            managers={managers}
          />
        );
      })}
    </Box>
  );
};

export default Games;
