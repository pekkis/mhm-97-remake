import React from "react";
import Inspector from "react-inspector";
import { Map } from "immutable";

const Streaks = props => {
  const { teams, competitions, competition, team, streaks } = props;

  const teamStreaks = streaks.getIn([team, competition], Map());

  return (
    <div>
      {teamStreaks
        .filter(s => s > 1)
        .map((s, index) => {
          return (
            <div>
              {s} {index}
            </div>
          );
        })
        .toList()}
    </div>
  );
};

export default Streaks;
