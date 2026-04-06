import React from "react";
import Table from "../league-table/Table";
import ResponsiveTable from "../responsive-table/ResponsiveTable";
import Matchups from "../playoffs/Matchups";
import { List } from "immutable";
import Games from "../gameday/Games";
import Streaks from "../containers/StreaksContainer";

const Situation = (props) => {
  const { competitions, interesting, teams, manager } = props;

  return (
    <div>
      {interesting
        .map((i) => competitions[i])
        .map((competition, key) => {
          const phaseNo = competition.phase;
          const phase = competition.phases[phaseNo];

          return (
            <div key={competition.id}>
              <h3>{competition.name}</h3>

              <Streaks competition={key} team={manager.get("team")} />

              {phase.groups
                .filter(
                  (group) =>
                    phase.groups.length === 1 ||
                    group.teams.includes(manager.get("team"))
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
                          managers={List.of(manager)}
                        />
                      </div>

                      <div>
                        {phase.type === "round-robin" && (
                          <div>
                            <h4>Sarjataulukko</h4>
                            <ResponsiveTable>
                              <Table
                                managers={List.of(manager)}
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
                                managers={List.of(manager)}
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
                              managers={List.of(manager)}
                              teams={teams}
                              group={group}
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
