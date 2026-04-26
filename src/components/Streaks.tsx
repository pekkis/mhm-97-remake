import { entries } from "remeda";
import Box from "./styled-system/Box";
import { useGameContext } from "@/context/game-machine-context";

const humanReadables: Record<string, string> = {
  loss: "tappiota",
  noWin: "voitotonta ottelua",
  noLoss: "tappiotonta ottelua",
  win: "voittoa"
};

type StreaksProps = {
  competition: string;
  team: number;
};

const Streaks = ({ competition, team }: StreaksProps) => {
  const streaks = useGameContext((ctx) => ctx.stats.streaks.team);

  const teamStreaks = streaks?.[team]?.[competition] ?? {};
  const filtered = entries(teamStreaks).filter(([, s]) => s > 1);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <Box my={1}>
      <h4>Putket</h4>
      {filtered.map(([key, s]) => {
        return (
          <div key={key}>
            <strong>{s}</strong> {humanReadables[key]} putkeen.
          </div>
        );
      })}
    </Box>
  );
};

export default Streaks;
