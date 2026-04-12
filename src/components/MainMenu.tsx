import Events from "./events/Events";
import Situation from "./context-sensitive/Situation";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Forward from "./context-sensitive/Forward";
import Current from "./context-sensitive/Current";

import Box from "./styled-system/Box";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { activeManager, interestingCompetitions } from "@/selectors";
import { requestResolveEvent } from "../ducks/event";

const MainMenu = () => {
  const dispatch = useAppDispatch();
  const manager = useAppSelector(activeManager);
  const teams = useAppSelector((state) => state.game.teams);
  const competitions = useAppSelector((state) => state.game.competitions);
  const events = useAppSelector((state) => state.event.events);
  const interesting = useAppSelector(interestingCompetitions);

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
