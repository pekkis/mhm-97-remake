import Events from "./events/Events";
import Situation from "./context-sensitive/Situation";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Forward from "./context-sensitive/Forward";
import Current from "./context-sensitive/Current";

import Box from "./styled-system/Box";
import { useAppDispatch } from "@/config/redux";
import { useGameContext } from "@/context/game-machine-context";
import { activeManager, interestingCompetitions } from "@/machines/selectors";
import { requestResolveEvent } from "@/ducks/event";

const MainMenu = () => {
  const dispatch = useAppDispatch();
  const manager = useGameContext(activeManager);
  const teams = useGameContext((ctx) => ctx.teams);
  const competitions = useGameContext((ctx) => ctx.competitions);
  const events = useGameContext((ctx) => ctx.event.events);
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

        <Events
          manager={manager}
          events={events}
          onAnswer={(e, key) =>
            dispatch(requestResolveEvent({ event: e, value: key }))
          }
        />
      </Box>
    </HeaderedPage>
  );
};

export default MainMenu;
