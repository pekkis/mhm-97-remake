import News from "./news/News";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Season from "./data/Season";
import Announcements from "./events/Announcements";

import Box from "./styled-system/Box";
import { useAppSelector } from "@/config/redux";

const EndOfSeason = () => {
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!],
  );
  const news = useAppSelector((state) => state.news.news);
  const turn = useAppSelector((state) => state.game.turn);
  const announcements = useAppSelector((state) => state.news.announcements);

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
