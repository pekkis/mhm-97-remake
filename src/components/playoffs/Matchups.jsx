import React from "react";

const Matchups = (props) => {
  const { managers, teams, group } = props;

  console.log(group, "group");

  const matches = group.stats;

  return (
    <table>
      <tbody>
        {matches.map((m, i) => {
          return (
            <tr key={i}>
              <td>{teams[m.home.id]?.name}</td>
              <td>-</td>
              <td>{teams[m.away.id]?.name}</td>
              <td>
                {m.home.wins}-{m.away.wins}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Matchups;
