import Announcements from "./events/Announcements";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Box from "./ui/Box";
import { useGameContext } from "@/context/game-machine-context";
import { activeManager } from "@/machines/selectors";

const News = () => {
  const manager = useGameContext(activeManager);
  const announcements = useGameContext((ctx) => ctx.news.announcements);

  return (
    <HeaderedPage>
      <Header />
      <ManagerInfo details />

      <Box p="md">
        <h2>Tapahtumat</h2>
        <Announcements
          announcements={announcements[manager.id.toString()] || []}
        />
      </Box>
    </HeaderedPage>
  );
};

export default News;
