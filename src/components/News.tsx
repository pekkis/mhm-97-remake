import Announcements from "./events/Announcements";
import ManagerInfo from "./ManagerInfo";
import StickyMenu from "./StickyMenu";
import AdvancedHeaderedPage from "./ui/AdvancedHeaderedPage";
import Box from "./ui/Box";
import { useGameContext } from "@/context/game-machine-context";
import { activeManager } from "@/machines/selectors";

const News = () => {
  const manager = useGameContext(activeManager);
  const announcements = useGameContext((ctx) => ctx.news.announcements);

  return (
    <AdvancedHeaderedPage
      stickyMenu={<StickyMenu />}
      managerInfo={<ManagerInfo details />}
    >
      <Box p="md">
        <h2>Tapahtumat</h2>
        <Announcements
          announcements={announcements[manager.id.toString()] || []}
        />
      </Box>
    </AdvancedHeaderedPage>
  );
};

export default News;
