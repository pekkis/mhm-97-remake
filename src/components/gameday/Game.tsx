import type { FC } from "react";
import * as styles from "./Game.css";
import TeamName from "../team/Name";
import type { Team } from "../../ducks/game";
import type { Manager } from "../../ducks/manager";
import type { Group, Pairing } from "../../types/competitions";

type GameProps = {
  context: Group;
  pairing: Pairing;
  teams: Team[];
  managers: Record<string, Manager>;
};

const Game: FC<GameProps> = ({ context, pairing, teams, managers }) => {
  return (
    <div className={styles.row}>
      <div className={styles.teamDiv}>
        <TeamName
          managers={managers}
          team={teams[context.teams[pairing.home]]}
        />
      </div>
      <div className={styles.separator}>-</div>
      <div className={styles.teamDiv}>
        <TeamName
          managers={managers}
          team={teams[context.teams[pairing.away]]}
        />
      </div>
      <div className={styles.result}>
        {pairing.result && (
          <>
            <div>{pairing.result.home}</div>
            <div className={styles.separator}>-</div>
            <div>{pairing.result.away}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default Game;
