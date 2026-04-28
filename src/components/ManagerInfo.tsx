import { amount } from "@/services/format";
import { getEffective } from "@/services/effects";
import Box from "./ui/Box";
import TurnIndicator from "./game/TurnIndicator";
import { useGameContext } from "@/context/game-machine-context";
import { activeManager } from "@/machines/selectors";

import * as styles from "./ManagerInfo.css";

type ManagerInfoProps = {
  details?: boolean;
};

const ManagerInfo = ({ details = false }: ManagerInfoProps) => {
  const manager = useGameContext(activeManager);
  const teams = useGameContext((ctx) => ctx.teams);
  const turn = useGameContext((ctx) => ctx.turn);

  const team = getEffective(teams[manager.team!]);

  return (
    <Box p="md" bg="surfaceMuted">
      <h2 className={styles.managerName}>{manager.name}</h2>

      {details && (
        <div className={styles.details}>
          <div className={styles.detail}>
            <div className={styles.title}>Voima</div>
            <div>{team.strength}</div>
          </div>

          <div className={styles.detail}>
            <div className={styles.title}>Moraali</div>
            <div>{team.morale}</div>
          </div>

          <div className={styles.detail}>
            <div className={styles.title}>Raha</div>
            <div>{amount(manager.balance)}</div>
          </div>

          <div className={styles.detail}>
            <div className={styles.title}>Vuoro</div>
            <div>
              <TurnIndicator turn={turn} />
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default ManagerInfo;
