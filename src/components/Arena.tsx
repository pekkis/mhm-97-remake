import StickyMenu from "./StickyMenu";
import AdvancedHeaderedPage from "./ui/AdvancedHeaderedPage";
import ManagerInfo from "./ManagerInfo";
import ButtonRow from "./form/ButtonRow";
import Button from "./form/Button";
import arenas from "@/data/arenas";
import clsx from "clsx";
import * as styles from "./Arena.css";
import { currency } from "@/services/format";
import Box from "./ui/Box";
import {
  GameMachineContext,
  useGameContext
} from "@/context/game-machine-context";
import { activeManager, canImproveArena } from "@/machines/selectors";

const Arenas = () => {
  const manager = useGameContext(activeManager);
  const canDo = useGameContext(canImproveArena(manager.id));
  const gameActor = GameMachineContext.useActorRef();

  const currentLevel = manager.arena.level;
  const nextLevel = arenas[currentLevel + 1];

  return (
    <AdvancedHeaderedPage
      stickyMenu={<StickyMenu back />}
      managerInfo={<ManagerInfo details />}
    >
      <Box p="md">
        <h2>Areena</h2>

        <div>
          <h3>Areenasi sijoitus areenahierarkiassa:</h3>

          {arenas
            .map((arena, level) => {
              return (
                <div
                  className={clsx(
                    styles.arenaRow,
                    level === currentLevel && styles.arenaRowCurrent
                  )}
                  key={arena.id}
                >
                  {arena.name}
                </div>
              );
            })
            .toReversed()}
        </div>

        <ButtonRow>
          {nextLevel && (
            <Button
              block
              disabled={!canDo}
              onClick={() =>
                gameActor.send({
                  type: "IMPROVE_ARENA",
                  payload: { manager: manager.id }
                })
              }
            >
              <div>Paranna halliolosuhteitasi</div>
              <div>{currency(nextLevel.price)}</div>
            </Button>
          )}
        </ButtonRow>
      </Box>
    </AdvancedHeaderedPage>
  );
};

export default Arenas;
