import React from "react";
import styled from "styled-components";
import RTable from "../responsive-table/Table";
import Td from "../responsive-table/Td";

const TableRow = styled.tr`
  background-color: rgb(255, 255, 255);
  ${(props) =>
    props.dark &&
    `
    background-color: rgb(238, 238, 238)
  `}
`;

const Table = (props) => {
  const { managers, teams, division, isClone } = props;
  const colors = division.colors;
  const managerTeams = Object.values(managers).map((p) => p.team);
  const tbl = division.stats.map((entry) => ({
    ...entry,
    managerControlled: managerTeams.includes(entry.id)
  }));

  return (
    <RTable isClone={isClone}>
      <thead>
        <tr>
          <th className="fixed">Joukkue</th>
          <th>O</th>
          <th>V</th>
          <th>TP</th>
          <th>H</th>
          <th>P</th>
          <th>TM</th>
          <th>-</th>
          <th>PM</th>
        </tr>
      </thead>
      <tbody>
        {tbl.map((t, i) => {
          return (
            <TableRow key={t.id} dark={colors?.[i] === "d"}>
              <td className="fixed">
                {t.managerControlled ? (
                  <strong>{teams[t.id]?.name}</strong>
                ) : (
                  teams[t.id]?.name
                )}
              </td>
              <td>{t.gamesPlayed}</td>
              <td>{t.wins}</td>
              <td>{t.draws}</td>
              <td>{t.losses}</td>
              <td>{t.points}</td>
              <td>{t.goalsFor}</td>
              <td>-</td>
              <td>{t.goalsAgainst}</td>
            </TableRow>
          );
        })}
      </tbody>
    </RTable>
  );
};

export default Table;
