import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import ManagerInfo from "./ManagerInfo";
import ButtonRow from "./form/ButtonRow";
import Button from "./form/Button";
import arenas from "@/data/arenas";
import clsx from "clsx";
import * as styles from "./Arena.css";
import { currency } from "@/services/format";
import Box from "./styled-system/Box";
import { useAppDispatch } from "@/config/redux";
import { useGameContext } from "@/context/game-machine-context";
import { managerImproveArena } from "@/ducks/manager";
import { activeManager } from "@/machines/selectors";

const Arenas = () => {
  const manager = useGameContext(activeManager);
  const dispatch = useAppDispatch();

  const currentLevel = manager.arena.level;

  const nextLevel = arenas[currentLevel + 1];

  const canDo = currentLevel < 9 && manager.balance >= nextLevel.price;

  return (
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

      <Box p={1}>
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
                dispatch(managerImproveArena({ manager: manager.id }))
              }
            >
              <div>Paranna halliolosuhteitasi</div>
              <div>{currency(nextLevel.price)}</div>
            </Button>
          )}
        </ButtonRow>
      </Box>
    </HeaderedPage>
  );
};

export default Arenas;
