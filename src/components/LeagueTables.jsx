import React from "react";
import Table from "./league-table/Table";
import Header from "./containers/HeaderContainer";
import HeaderedPage from "./ui/HeaderedPage";
import Box from "./styled-system/Box";

const LeagueTables = (props) => {
  const { managers, teams, competitions } = props;

  return (
    <HeaderedPage>
      <Header back />
      <Box p={1}>
        <h2>Sarjataulukot</h2>

        {Object.values(competitions)
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
