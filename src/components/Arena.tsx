import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import ManagerInfo from "./ManagerInfo";
import ButtonRow from "./form/ButtonRow";
import Button from "./form/Button";
import arenas from "../data/arenas";
import styled, { css } from "styled-components";
import { currency } from "../services/format";
import Box from "./styled-system/Box";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { improveArena } from "../ducks/manager";

const ArenaHierarchy = styled.div``;

const ArenaRow = styled.div<{ $current?: boolean }>`
  ${(props) =>
    props.$current &&
    css`
      font-weight: bold;
    `}
`;

const Arenas = () => {
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!],
  );
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

        <ArenaHierarchy>
          <h3>Areenasi sijoitus areenahierarkiassa:</h3>

          {arenas
            .map((arena, level) => {
              return (
                <ArenaRow $current={level === currentLevel} key={arena.id}>
                  {arena.name}
                </ArenaRow>
              );
            })
            .toReversed()}
        </ArenaHierarchy>

        <ButtonRow>
          {nextLevel && (
            <Button
              block
              disabled={!canDo}
              onClick={() => dispatch(improveArena(manager.id))}
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
