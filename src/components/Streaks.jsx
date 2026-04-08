import React from "react";
import Box from "./styled-system/Box";

const humanReadables = {
  loss: "tappiota",
  noWin: "voitotonta ottelua",
  noLoss: "tappiotonta ottelua",
  win: "voittoa"
};

const Streaks = (props) => {
  const { competition, team, streaks } = props;

  const teamStreaks = streaks?.[team]?.[competition] ?? {};
  const filtered = Object.entries(teamStreaks).filter(([, s]) => s > 1);

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
