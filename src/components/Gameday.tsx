import calendar from "@/data/calendar";
import Table from "./league-table/LeagueTable";
import StickyMenu from "./StickyMenu";
import HeaderedPage from "./ui/HeaderedPage";
import Games from "./gameday/Games";
import Box from "./ui/Box";
import { useGameContext } from "@/context/game-machine-context";

const Gameday = () => {
  const turn = useGameContext((ctx) => ctx.turn);
  const managers = useGameContext((ctx) => ctx.manager.managers);
  const teams = useGameContext((ctx) => ctx.teams);
  const competitions = useGameContext((ctx) => ctx.competitions);

  const calendarEntry = calendar[turn.round];

  const currentCompetitions = calendarEntry.gamedays.map(
    (c) => competitions[c]
  );

  return (
    <HeaderedPage>
      <StickyMenu />

      <Box p="md">
        <h2>Pelipäivä</h2>

        {currentCompetitions.map((competition) => {
          const currentPhase = competition.phases[competition.phase];

          return (
            <div key={competition.name}>
              {currentPhase.groups.map((group, groupIndex) => {
                const currentRound = group.round;

                return (
                  <div key={groupIndex}>
                    <h3>
                      {competition.name}, {group.name} [{currentRound}]
                    </h3>

                    <Games
                      teams={teams}
                      context={group}
                      round={currentRound}
                      managers={managers}
                    />

                    {currentPhase.type === "tournament" && (
                      <div>
                        <Table
                          division={group}
                          managers={managers}
                          teams={teams}
                        />
                      </div>
                    )}

                    <div />
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

export default Gameday;
