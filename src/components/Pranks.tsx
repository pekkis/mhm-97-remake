import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";

import SelectVictim from "./pranks/SelectVictim";
import SelectType from "./pranks/SelectType";
import ConfirmPrank from "./pranks/ConfirmPrank";
import Box from "./styled-system/Box";
import Calendar from "./ui/Calendar";

import difficultyLevels from "../data/difficulty-levels";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import {
  orderPrank,
  selectPrankType,
  selectPrankVictim,
  cancelPrank,
} from "../ducks/prank";

const Pranks = () => {
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!],
  );
  const teams = useAppSelector((state) => state.game.teams);
  const competitions = useAppSelector((state) => state.game.competitions);
  const prank = useAppSelector((state) => state.ui.prank);
  const dispatch = useAppDispatch();

  const phl = competitions.phl;
  const division = competitions.division;

  const difficultyLevel = difficultyLevels[manager.difficulty];

  const canDo = difficultyLevel.pranksPerSeason > manager.pranksExecuted;

  const targetCompetition = phl.teams.includes(manager.team!) ? phl : division;

  return (
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

      <Box p={1}>
        <Calendar
          when={(c) => c.pranks}
          fallback={<p>Jäynät on tältä kaudelta jäynäytetty.</p>}
        >
          <h2>Jäynät</h2>

          {!canDo && (
            <p>
              Olet jo jäynäyttänyt {manager.pranksExecuted} kertaa tällä
              kaudella. Nähdään ensi vuonna!
            </p>
          )}

          {!prank.type && (
            <SelectType
              manager={manager}
              enabled={canDo}
              competition={targetCompetition.name}
              selectType={(id: string) => dispatch(selectPrankType(id))}
              cancel={(id: string) => dispatch(cancelPrank(id))}
            />
          )}

          {prank.type && !prank.victim && (
            <SelectVictim
              manager={manager}
              prank={prank}
              competition={targetCompetition}
              teams={teams}
              selectVictim={(id: string) => dispatch(selectPrankVictim(id))}
              cancel={(id: string) => dispatch(cancelPrank(id))}
            />
          )}

          {prank.type && prank.victim && (
            <ConfirmPrank
              manager={manager}
              prank={prank}
              execute={(m: string, t: string, v: string) =>
                dispatch(orderPrank(m, t, v))
              }
              teams={teams}
              cancel={(id: string) => dispatch(cancelPrank(id))}
            />
          )}
        </Calendar>
      </Box>
    </HeaderedPage>
  );
};

export default Pranks;
