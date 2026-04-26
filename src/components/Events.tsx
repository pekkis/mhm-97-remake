import EventsList from "./events/Events";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Box from "./styled-system/Box";
import { useAppDispatch } from "@/config/redux";
import { useGameContext } from "@/context/game-machine-context";
import { requestResolveEvent } from "@/ducks/event";
import { activeManager } from "@/machines/selectors";

const Events = () => {
  const dispatch = useAppDispatch();
  const manager = useGameContext(activeManager);
  const events = useGameContext((ctx) => ctx.event.events);

  return (
    <HeaderedPage>
      <Header />
      <ManagerInfo details />

      <Box p={1}>
        <h2>Tapahtumat</h2>
        <EventsList
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

export default Events;
