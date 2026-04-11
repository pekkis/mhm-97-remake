import EventsList from "./events/Events";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Box from "./styled-system/Box";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { requestResolveEvent } from "../ducks/event";

const Events = () => {
  const dispatch = useAppDispatch();
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!],
  );
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
          onAnswer={(e, key) => dispatch(requestResolveEvent({ event: e, value: key }))}
        />
      </Box>
    </HeaderedPage>
  );
};

export default Events;
