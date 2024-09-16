import React from "react";
import EventsList from "./events/Events";
import Announcements from "./events/Announcements";
import ManagerInfo from "./containers/ManagerInfoContainer";
import Header from "./containers/HeaderContainer";
import HeaderedPage from "./ui/HeaderedPage";
import Box from "./styled-system/Box";
import { List } from "immutable";

const News = props => {
  const { manager, resolveEvent, events, announcements } = props;

  return (
    <HeaderedPage>
      <Header />
      <ManagerInfo details />

      <Box p={1}>
        <h2>Tapahtumat</h2>
        <EventsList
          manager={manager}
          events={events}
          resolveEvent={resolveEvent}
        />
        <Announcements
          announcements={announcements.get(
            manager.get("id").toString(),
            List()
          )}
        />
      </Box>
    </HeaderedPage>
  );
};

export default News;
