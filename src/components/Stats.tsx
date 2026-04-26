import { useState } from "react";

import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";

import Box from "./styled-system/Box";
import Tabs from "./ui/Tabs";
import Tab from "./ui/Tab";

import ManagerStats from "./stats/ManagerStats";
import TeamStats from "./stats/TeamStats";
import { useGameContext } from "@/context/game-machine-context";
import { useSelector } from "@xstate/store-react";
import { countryStore } from "@/stores/country";
import { activeManager } from "@/machines/selectors";

const Stats = () => {
  const manager = useGameContext(activeManager);
  const teams = useGameContext((ctx) => ctx.teams);
  const competitions = useGameContext((ctx) => ctx.competitions);
  const stats = useGameContext((ctx) => ctx.stats);
  const countries = useSelector(countryStore, (s) => s.context.countries);

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
