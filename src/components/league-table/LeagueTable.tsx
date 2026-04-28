import type { FC } from "react";
import clsx from "clsx";
import * as styles from "./LeagueTable.css";

import type { Team } from "@/state/game";
import type { Manager } from "@/state/manager";
import type { Group, TeamStat } from "@/types/competitions";
import { values } from "remeda";

type TableProps = {
  managers: Record<string, Manager>;
  teams: Team[];
  division: Group;
};

const LeagueTable: FC<TableProps> = ({ managers, teams, division }) => {
  const colors = "colors" in division ? (division.colors as string[]) : [];
  const managerTeams = values(managers).map((m) => m.team);
  const rows = (division.stats as TeamStat[]).map((entry) => ({
    ...entry,
    managerControlled: managerTeams.includes(entry.id)
  }));

  return (
    <div className={styles.scroller}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thStart}>Joukkue</th>
            <th className={styles.th}>O</th>
            <th className={styles.th}>V</th>
            <th className={styles.th}>TP</th>
            <th className={styles.th}>H</th>
            <th className={styles.th}>TM</th>
            <th className={styles.th}>PM</th>
            <th className={styles.thEnd}>P</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => {
            const tone = colors[i] === "d" ? "dark" : "light";
            return (
              <tr
                key={t.id}
                className={clsx(
                  styles.row[tone],
                  t.managerControlled && styles.managerRow
                )}
              >
                <td className={styles.tdStart}>{teams[t.id]?.name}</td>
                <td className={styles.td}>{t.gamesPlayed}</td>
                <td className={styles.td}>{t.wins}</td>
                <td className={styles.td}>{t.draws}</td>
                <td className={styles.td}>{t.losses}</td>
                <td className={styles.td}>{t.goalsFor}</td>
                <td className={styles.td}>{t.goalsAgainst}</td>
                <td className={styles.tdEnd}>{t.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeagueTable;
