import React from "react";

import News from "./news/News";
import Header from "./containers/HeaderContainer";
import HeaderedPage from "./ui/HeaderedPage";
import Season from "./data/Season";
import Announcements from "./events/Announcements";

import Box from "./styled-system/Box";

const EndOfSeason = (props) => {
  const { manager, news, turn, announcements } = props;

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
