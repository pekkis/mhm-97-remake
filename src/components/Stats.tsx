import { useState } from "react";

import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";

import Box from "./styled-system/Box";
import Tabs from "./ui/Tabs";
import Tab from "./ui/Tab";

import ManagerStats from "./stats/ManagerStats";
import TeamStats from "./stats/TeamStats";
import { useAppSelector } from "@/config/redux";
import { activeManager } from "@/selectors";

const Stats = () => {
  const manager = useAppSelector(activeManager);
  const teams = useAppSelector((state) => state.game.teams);
  const competitions = useAppSelector((state) => state.game.competitions);
  const stats = useAppSelector((state) => state.stats);
  const countries = useAppSelector((state) => state.country.countries);

  const [tab, setTab] = useState(0);

  return (
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

      <Box p={1}>
        <h2>Tilastot</h2>

        <Tabs selected={tab} onSelect={setTab}>
          <Tab title="Joukkueet">
            <TeamStats teams={teams} stats={stats} countries={countries} />
          </Tab>

          <Tab title="Manageri">
            <ManagerStats
              manager={manager}
              competitions={competitions}
              stats={stats}
              teams={teams}
            />
          </Tab>
        </Tabs>
      </Box>
    </HeaderedPage>
  );
};

export default Stats;
