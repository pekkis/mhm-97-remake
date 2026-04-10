import Events from "./events/Events";
import Situation from "./context-sensitive/Situation";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Forward from "./context-sensitive/Forward";
import Current from "./context-sensitive/Current";

import Box from "./styled-system/Box";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { interestingCompetitions } from "../data/selectors";
import { resolveEvent } from "../ducks/event";

const MainMenu = () => {
  const dispatch = useAppDispatch();
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!],
  );
  const teams = useAppSelector((state) => state.game.teams);
  const competitions = useAppSelector((state) => state.game.competitions);
  const events = useAppSelector((state) => state.event.events);
  const interesting = useAppSelector((state) =>
    interestingCompetitions(state.manager.active!)(state),
  );

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
          onAnswer={(e, key) => dispatch(resolveEvent(e, key))}
        />
      </Box>
    </HeaderedPage>
  );
};

export default MainMenu;
