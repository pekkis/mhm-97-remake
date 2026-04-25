import type { FC } from "react";
import competitionTypes from "@/services/competition-type";
import Game from "./Game";
import Box from "@/components/styled-system/Box";
import type { Team } from "@/state/game";
import type { Manager } from "@/state/manager";
import type { Group } from "@/types/competitions";

type GamesProps = {
  teams: Team[];
  context: Group;
  round: number;
  managers: Record<string, Manager>;
};

const Games: FC<GamesProps> = ({ teams, context, round, managers }) => {
  const playMatch = competitionTypes[context.type].playMatch;
  const pairings = (context.schedule[round] ?? []).filter((_p, i) => {
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
