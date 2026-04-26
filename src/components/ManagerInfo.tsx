import { amount } from "@/services/format";
import { getEffective } from "@/services/effects";
import Box from "./styled-system/Box";
import TurnIndicator from "./game/TurnIndicator";
import { GameMachineContext } from "@/context/game-machine-context";
import { activeManager } from "@/machines/selectors";

import * as styles from "./ManagerInfo.css";

type ManagerInfoProps = {
  details?: boolean;
};

const ManagerInfo = ({ details = false }: ManagerInfoProps) => {
  const manager = GameMachineContext.useSelector((state) =>
    activeManager(state.context)
  );
  const teams = GameMachineContext.useSelector((state) => state.context.teams);
  const turn = GameMachineContext.useSelector((state) => state.context.turn);

  const team = getEffective(teams[manager.team!]);

  return (
    <Box p={1} bg="bar">
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
