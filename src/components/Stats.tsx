import { useState } from "react";

import ManagerInfo from "./ManagerInfo";
import StickyMenu from "./StickyMenu";
import AdvancedHeaderedPage from "./ui/AdvancedHeaderedPage";

import Box from "./ui/Box";
import Tabs from "./ui/Tabs";

import ManagerStats from "./stats/ManagerStats";
import TeamStats from "./stats/TeamStats";
import { useGameContext } from "@/context/game-machine-context";
import { activeManager } from "@/machines/selectors";

const Stats = () => {
  const manager = useGameContext(activeManager);
  const teams = useGameContext((ctx) => ctx.teams);
  const competitions = useGameContext((ctx) => ctx.competitions);
  const stats = useGameContext((ctx) => ctx.stats);
  const countries = useGameContext((ctx) => ctx.country.countries);

  const [tab, setTab] = useState(0);

  return (
    <AdvancedHeaderedPage
      stickyMenu={<StickyMenu back />}
      managerInfo={<ManagerInfo details />}
    >
      <Box p="md">
        <h2>Tilastot</h2>

        <Tabs
          selected={tab}
          onSelect={setTab}
          items={[
            {
              title: "Joukkueet",
              content: () => (
                <TeamStats teams={teams} stats={stats} countries={countries} />
              )
            },
            {
              title: "Manageri",
              content: () => (
                <ManagerStats
                  manager={manager}
                  competitions={competitions}
                  stats={stats}
                  teams={teams}
                />
              )
            }
          ]}
        />
      </Box>
    </AdvancedHeaderedPage>
  );
};

export default Stats;
