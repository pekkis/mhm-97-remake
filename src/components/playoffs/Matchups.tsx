import type { FC } from "react";
import type { Team } from "@/state/game";
import type { Manager } from "@/state/manager";
import type { PlayoffGroup, MatchupStat } from "@/types/competitions";

type MatchupsProps = {
  managers: Record<string, Manager>;
  teams: Team[];
  group: PlayoffGroup;
};

const Matchups: FC<MatchupsProps> = ({ teams, group }) => {
  const matches = group.stats as MatchupStat[];

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
