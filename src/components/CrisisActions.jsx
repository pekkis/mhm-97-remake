import React from "react";
import { CRISIS_MORALE_MAX } from "../data/constants";
import Button from "./form/Button";
import Header from "./containers/HeaderContainer";
import HeaderedPage from "./ui/HeaderedPage";
import ManagerInfo from "./containers/ManagerInfoContainer";
import Calendar from "./ui/containers/CalendarContainer";
import Box from "./styled-system/Box";

import crisis from "../data/crisis";
import { currency as c } from "../services/format";
import { getEffective } from "../services/effects";

const TransferMarket = props => {
  const { manager, teams, competitions, crisisMeeting } = props;

  const balance = manager.get("balance");
  const team = getEffective(teams.get(manager.get("team")));

  const crisisInfo = crisis(team, competitions);

  return (
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

      <Box p={1}>
        <h2>Kriisipalaveri</h2>

        <Calendar
          when={c => c.get("crisisMeeting")}
          fallback={
            <p>
              Tässä vaiheessa kautta on auttamatta liian myöhäistä
              kriisipalaveroida!
            </p>
          }
        >
          <p>
            Kriisipalaveri auttaa joukkuetta unohtamaan tappioputken ja
            keskittymään tulevaan. Se maksaa {c(crisisInfo.get("amount"))}.
          </p>

          <Button
            block
            disabled={
              balance < crisisInfo.get("amount") ||
              team.get("morale") > CRISIS_MORALE_MAX
            }
            onClick={() => {
              crisisMeeting(manager.get("id"));
            }}
          >
            Pidä kriisipalaveri
          </Button>
        </Calendar>
      </Box>
    </HeaderedPage>
  );
};

export default TransferMarket;
