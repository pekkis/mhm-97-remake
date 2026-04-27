import Situation from "./context-sensitive/Situation";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Forward from "./context-sensitive/Forward";
import Current from "./context-sensitive/Current";

import Box from "./styled-system/Box";
import { useGameContext } from "@/context/game-machine-context";
import { activeManager, interestingCompetitions } from "@/machines/selectors";

const MainMenu = () => {
  const manager = useGameContext(activeManager);
  const teams = useGameContext((ctx) => ctx.teams);
  const competitions = useGameContext((ctx) => ctx.competitions);
  const interesting = useGameContext(interestingCompetitions);

  return (
    <HeaderedPage>
      <Header menu forward={<Forward />} />

      <ManagerInfo details />

      <Box p={1}>
        <Current />

        <Situation
          manager={manager}
          competitions={competitions}
          interesting={interesting}
          teams={teams}
        />
      </Box>
    </HeaderedPage>
  );
};

export default MainMenu;
