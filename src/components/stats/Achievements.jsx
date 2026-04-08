import React from "react";

const medals = {
  0: "kulta",
  1: "hopea",
  2: "pronssi"
};

const playoffRounds = {
  phl: [
    [1, "neljännesfinaalit"],
    [2, "semifinaali"],
    [3, "pronssiottelu"]
  ],
  division: [
    [1, "neljännesfinaalit"],
    [2, "semifinaali"],
    [3, "finaali"]
  ]
};

const Achievements = (props) => {
  const { story } = props;

  const achievements = [
    medals[story.medal],
    !medals[story.medal] &&
      playoffRounds[story.mainCompetition]?.[story.lastRound]?.[1],
    story.ehlChampion && "euroopan mestaruus",
    story.promoted && "sarjanousu",
    story.relegated && "putoaminen"
  ].filter((t) => t);

  return <div>{achievements.join(", ")}</div>;
};

export default Achievements;
