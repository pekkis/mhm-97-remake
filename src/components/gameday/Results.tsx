import type { FC } from "react";
import * as styles from "./Results.css";
import Game from "./Game";
import Box from "@/components/styled-system/Box";
import type { Team } from "@/ducks/game";
import type { Manager } from "@/ducks/manager";
import type { Group } from "@/types/competitions";

type ResultsProps = {
  teams: Team[];
  context: Group;
  round: number;
  managers: Record<string, Manager>;
};

const Results: FC<ResultsProps> = ({ teams, context, round, managers }) => {
  const pairings = (context.schedule[round] ?? []).filter((p) => {
    return p.result;
  });

  return (
    <Box my={1}>
      <div className={styles.results}>
        {pairings.map((pairing, i) => {
          return (
            <Game
              key={i}
              context={context}
              pairing={pairing}
              managers={managers}
              teams={teams}
            />
          );
        })}
      </div>
    </Box>
  );
};

export default Results;
