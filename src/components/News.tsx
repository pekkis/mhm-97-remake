import EventsList from "./events/Events";
import Announcements from "./events/Announcements";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Box from "./styled-system/Box";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { requestResolveEvent } from "../ducks/event";
import { activeManager } from "@/data/selectors";

const News = () => {
  const dispatch = useAppDispatch();
  const manager = useAppSelector(activeManager);
  const events = useAppSelector((state) => state.event.events);
  const announcements = useAppSelector((state) => state.news.announcements);

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
        <Announcements
          announcements={announcements[manager.id.toString()] || []}
        />
      </Box>
    </HeaderedPage>
  );
};

export default News;
