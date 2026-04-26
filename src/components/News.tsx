import EventsList from "./events/Events";
import Announcements from "./events/Announcements";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Box from "./styled-system/Box";
import { useAppDispatch } from "@/config/redux";
import { useGameContext } from "@/context/game-machine-context";
import { requestResolveEvent } from "@/ducks/event";
import { activeManager } from "@/machines/selectors";

const News = () => {
  const dispatch = useAppDispatch();
  const manager = useGameContext(activeManager);
  const events = useGameContext((ctx) => ctx.event.events);
  const announcements = useGameContext((ctx) => ctx.news.announcements);

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
