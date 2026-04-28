import Table from "./league-table/LeagueTable";
import StickyMenu from "./StickyMenu";
import HeaderedPage from "./ui/HeaderedPage";
import Box from "./ui/Box";
import { useGameContext } from "@/context/game-machine-context";
import { values } from "remeda";

const LeagueTables = () => {
  const managers = useGameContext((ctx) => ctx.manager.managers);
  const teams = useGameContext((ctx) => ctx.teams);
  const competitions = useGameContext((ctx) => ctx.competitions);

  console.log({ teams, managers, competitions });

  return (
    <HeaderedPage>
      <StickyMenu back />
      <Box p="md">
        <h2>Sarjataulukot</h2>

        {values(competitions)
          .filter((c) => c.phase >= 0)
          .map((c) => {
            const phase = c.phases[0];
            const groups = phase.groups;

            return (
              <div key={c.id}>
                <h3>{c.name}</h3>
                {groups.map((group, i) => {
                  return (
                    <div key={i}>
                      <h4>{group.name}</h4>
                      <Table
                        division={group}
                        managers={managers}
                        teams={teams}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
      </Box>
    </HeaderedPage>
  );
};

export default LeagueTables;
