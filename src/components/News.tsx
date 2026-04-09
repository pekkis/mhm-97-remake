import EventsList from "./events/Events";
import Announcements from "./events/Announcements";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Box from "./styled-system/Box";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { resolveEvent } from "../ducks/event";

const News = () => {
  const dispatch = useAppDispatch();
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!],
  );
  const events = useAppSelector((state) => state.event.events);
  const announcements = useAppSelector((state) => state.news.announcements);
  const advanceEnabled = useAppSelector((state) => state.ui.advanceEnabled);

  return (
    <HeaderedPage>
      <Header />
      <ManagerInfo details />

      <Box p={1}>
        <h2>Tapahtumat</h2>
        <EventsList
          manager={manager}
          events={events}
          onAnswer={(e, key) => dispatch(resolveEvent(e, key))}
        />
        <Announcements
          announcements={announcements[manager.id.toString()] || []}
        />
      </Box>
    </HeaderedPage>
  );
};

export default News;
