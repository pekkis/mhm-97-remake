import EventsList from "./events/Events";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Box from "./styled-system/Box";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { requestResolveEvent } from "../ducks/event";
import { activeManager } from "@/data/selectors";

const Events = () => {
  const dispatch = useAppDispatch();
  const manager = useAppSelector(activeManager);
  const events = useAppSelector((state) => state.event.events);

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
