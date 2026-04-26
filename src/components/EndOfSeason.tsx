import News from "./news/News";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Season from "./data/Season";
import Announcements from "./events/Announcements";

import Box from "./styled-system/Box";
import { useGameContext } from "@/context/game-machine-context";
import { activeManager } from "@/machines/selectors";

const EndOfSeason = () => {
  const manager = useGameContext(activeManager);
  const news = useGameContext((ctx) => ctx.news.news);
  const turn = useGameContext((ctx) => ctx.turn);
  const announcements = useGameContext((ctx) => ctx.news.announcements);

  return (
    <HeaderedPage>
      <Header forward="Seuraava kausi" />

      <Box p={1}>
        <h2>
          Kausi <Season long index={turn.season} />
        </h2>

        <Announcements
          announcements={announcements[manager.id.toString()] || []}
        />

        <News manager={manager} news={news} />
      </Box>
    </HeaderedPage>
  );
};

export default EndOfSeason;
