import { CRISIS_COST, CRISIS_MORALE_MAX } from "../data/constants";

const crisis = (team, competitions) => {
  const division = competitions.division;

  const amount = division.teams.includes(team.id)
    ? CRISIS_COST / 2
    : CRISIS_COST;

  return {
    amount,
    moraleGain: 4
  };
};

export default crisis;
