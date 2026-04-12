import type { FC } from "react";
import Table from "@/components/league-table/Table";
import ResponsiveTable from "@/components/responsive-table/ResponsiveTable";
import Matchups from "@/components/playoffs/Matchups";
import Games from "@/components/gameday/Games";
import Streaks from "@/components/Streaks";
import type { Team } from "@/ducks/game";
import type { Manager } from "@/ducks/manager";
import type { Competition, PlayoffGroup } from "@/types/competitions";

type SituationProps = {
  competitions: Record<string, Competition>;
  interesting: string[];
  teams: Team[];
  manager: Manager;
};

const Situation: FC<SituationProps> = ({
  competitions,
  interesting,
  teams,
  manager
}) => {
  return (
    <div>
      {interesting
        .map((i) => competitions[i])
        .map((competition) => {
          const phaseNo = competition.phase;
          const phase = competition.phases[phaseNo];

          return (
            <div key={competition.id}>
              <h3>{competition.name}</h3>

              <Streaks competition={competition.id} team={manager.team!} />

              {phase.groups
                .filter(
                  (group) =>
                    phase.groups.length === 1 ||
                    group.teams.includes(manager.team!)
                )
                .map((group, i) => {
                  return (
                    <div key={i}>
                      <div>
                        <h4>Seuraavat ottelut</h4>

                        <Games
                          context={group}
                          round={group.round}
                          teams={teams}
                          managers={{ [manager.id]: manager }}
                        />
                      </div>

                      <div>
                        {phase.type === "round-robin" && (
                          <div>
                            <h4>Sarjataulukko</h4>
                            <ResponsiveTable>
                              <Table
                                managers={{ [manager.id]: manager }}
                                teams={teams}
                                division={group}
                              />
                            </ResponsiveTable>
                          </div>
                        )}
                        {phase.type === "tournament" && (
                          <div>
                            <h4>Tilanne</h4>
                            <ResponsiveTable>
                              <Table
                                managers={{ [manager.id]: manager }}
                                teams={teams}
                                division={group}
                              />
                            </ResponsiveTable>
                          </div>
                        )}

                        {phase.type === "playoffs" && (
                          <div>
                            <h4>Tilanteet playoff-sarjoissa</h4>
                            <Matchups
                              managers={{ [manager.id]: manager }}
                              teams={teams}
                              group={group as PlayoffGroup}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })}
    </div>
  );
};

export default Situation;
