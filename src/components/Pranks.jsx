import ManagerInfo from "./containers/ManagerInfoContainer";
import Header from "./containers/HeaderContainer";
import HeaderedPage from "./ui/HeaderedPage";

import SelectVictim from "./pranks/SelectVictim";
import SelectType from "./pranks/SelectType";
import ConfirmPrank from "./pranks/ConfirmPrank";
import Box from "./styled-system/Box";
import Calendar from "./ui/containers/CalendarContainer";

import difficultyLevels from "../data/difficulty-levels";

const Pranks = (props) => {
  const {
    competitions,
    manager,
    teams,
    selectPrankType,
    selectPrankVictim,
    orderPrank,
    cancelPrank,
    prank
  } = props;

  const phl = competitions.phl;
  const division = competitions.division;

  const difficultyLevel = difficultyLevels[manager.difficulty];

  const canDo = difficultyLevel.pranksPerSeason > manager.pranksExecuted;

  const targetCompetition = phl.teams.includes(manager.team)
    ? phl
    : division;

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
              selectType={selectPrankType}
              cancel={cancelPrank}
            />
          )}

          {prank.type && !prank.victim && (
            <SelectVictim
              manager={manager}
              prank={prank}
              competition={targetCompetition}
              teams={teams}
              selectVictim={selectPrankVictim}
              cancel={cancelPrank}
            />
          )}

          {prank.type && prank.victim && (
            <ConfirmPrank
              manager={manager}
              prank={prank}
              execute={orderPrank}
              teams={teams}
              cancel={cancelPrank}
            />
          )}
        </Calendar>
      </Box>
    </HeaderedPage>
  );
};

export default Pranks;
