import type { FC } from "react";
import Season from "@/components/data/Season";
import Achievements from "./Achievements";
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

      <table>
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
            <td className="fixed">
              {competitions[story.mainCompetition].abbr}
            </td>
            <td className="fixed">{story.ranking + 1}</td>
            <td className="fixed">{teams[t.id]?.name}</td>
            <td>{t.gamesPlayed}</td>
            <td>{t.wins}</td>
            <td>{t.draws}</td>
            <td>{t.losses}</td>
            <td>{t.points}</td>
            <td>{t.goalsFor - t.goalsAgainst}</td>
          </tr>
        </tbody>
      </table>
      <Achievements story={story} />
    </Box>
  );
};

export default Story;
