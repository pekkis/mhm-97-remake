import type { FC } from "react";
import type { Team } from "@/state/game";
import type { Manager } from "@/state/manager";
import type { PlayoffGroup, MatchupStat } from "@/types/competitions";
import { Table, Td } from "@/components/ui/Table";

type MatchupsProps = {
  managers: Record<string, Manager>;
  teams: Team[];
  group: PlayoffGroup;
};

const Matchups: FC<MatchupsProps> = ({ teams, group }) => {
  const matches = group.stats as MatchupStat[];

  return (
    <Table>
      <tbody>
        {matches.map((m, i) => {
          return (
            <tr key={i}>
              <Td>{teams[m.home.id]?.name}</Td>
              <Td>-</Td>
              <Td>{teams[m.away.id]?.name}</Td>
              <Td>
                {m.home.wins}-{m.away.wins}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default Matchups;
