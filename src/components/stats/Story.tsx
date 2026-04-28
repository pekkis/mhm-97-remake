import type { FC } from "react";
import Season from "@/components/data/Season";
import Achievements from "./Achievements";
import ResponsiveTable from "@/components/responsive-table/ResponsiveTable";
import Table from "@/components/responsive-table/Table";
import Td from "@/components/responsive-table/Td";
import Box from "@/components/ui/Box";
import type { Team } from "@/state/game";
import type { Competition } from "@/types/competitions";

type StoryProps = {
  season: number;
  story: any;
  teams: Team[];
  competitions: Record<string, Competition>;
};

const Story: FC<StoryProps> = ({ season, story, teams, competitions }) => {
  const t = story.mainCompetitionStat;
  return (
    <Box my="md">
      <h3>
        <Season long index={season} />{" "}
      </h3>

      <ResponsiveTable>
        <Table>
          <thead>
            <tr>
              <th className="fixed">Sarja</th>
              <th className="fixed">Sija</th>
              <th className="fixed">Joukkue</th>
              <th>O</th>
              <th>V</th>
              <th>TP</th>
              <th>H</th>
              <th>P</th>
              <th>ME</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td className="fixed">
                {competitions[story.mainCompetition].abbr}
              </Td>
              <Td className="fixed">{story.ranking + 1}</Td>
              <Td className="fixed">{teams[t.id]?.name}</Td>
              <Td>{t.gamesPlayed}</Td>
              <td>{t.wins}</td>
              <td>{t.draws}</td>
              <td>{t.losses}</td>
              <td>{t.points}</td>
              <td>{t.goalsFor - t.goalsAgainst}</td>
            </tr>
          </tbody>
        </Table>
      </ResponsiveTable>
      <Achievements story={story} />
    </Box>
  );
};

export default Story;
