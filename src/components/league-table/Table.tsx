import type { FC } from "react";
import clsx from "clsx";
import * as styles from "./Table.css";
import RTable from "../responsive-table/Table";
import Td from "../responsive-table/Td";
import type { Team } from "../../ducks/game";
import type { Manager } from "../../ducks/manager";
import type { Group, TeamStat } from "../../types/competitions";

type TableProps = {
  managers: Record<string, Manager>;
  teams: Team[];
  division: Group;
  isClone?: boolean;
};

const Table: FC<TableProps> = ({ managers, teams, division, isClone }) => {
  const colors = "colors" in division ? (division.colors as string[]) : [];
  const managerTeams = Object.values(managers).map((p) => p.team);
  const tbl = (division.stats as TeamStat[]).map((entry) => ({
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
            <tr
              key={t.id}
              className={clsx(
                styles.tableRow,
                colors?.[i] === "d" && styles.tableRowDark
              )}
            >
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
            </tr>
          );
        })}
      </tbody>
    </RTable>
  );
};

export default Table;
