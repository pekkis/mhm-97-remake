import News from "./news/News";
import StickyMenu from "./StickyMenu";
import AdvancedHeaderedPage from "./ui/AdvancedHeaderedPage";
import Season from "./data/Season";
import Announcements from "./events/Announcements";

import Box from "./ui/Box";
import { useGameContext } from "@/context/game-machine-context";
import { activeManager } from "@/machines/selectors";

const EndOfSeason = () => {
  const manager = useGameContext(activeManager);
  const news = useGameContext((ctx) => ctx.news.news);
  const turn = useGameContext((ctx) => ctx.turn);
  const announcements = useGameContext((ctx) => ctx.news.announcements);

  return (
    <AdvancedHeaderedPage stickyMenu={<StickyMenu forward="Seuraava kausi" />}>
      <Box p="md">
        <h2>
          Kausi <Season long index={turn.season} />
        </h2>

        <Announcements
          announcements={announcements[manager.id.toString()] || []}
        />

        <News manager={manager} news={news} />
      </Box>
    </AdvancedHeaderedPage>
  );
};

export default EndOfSeason;
