import calendar from "../data/calendar";
import Table from "./league-table/Table";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Games from "./gameday/Games";
import Box from "./styled-system/Box";
import { useAppSelector } from "@/config/redux";

const Gameday = () => {
  const turn = useAppSelector((state) => state.game.turn);
  const managers = useAppSelector((state) => state.manager.managers);
  const teams = useAppSelector((state) => state.game.teams);
  const competitions = useAppSelector((state) => state.game.competitions);

  const calendarEntry = calendar[turn.round];

  const currentCompetitions = calendarEntry.gamedays.map(
    (c) => competitions[c],
  );

  return (
    <HeaderedPage>
      <Header />

      <Box p={1}>
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
