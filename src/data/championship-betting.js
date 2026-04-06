import { Map } from "immutable";

/*
IF v(x) >= yttre - 100 THEN ker(x) = 460: GOTO esukki
IF v(x) <= yttre - 100 THEN ker(x) = 1000: GOTO esukki
*/

const getOdds = (strength, average) => {
  switch (true) {
    case strength - average >= 100:
      return 1.1;
    case strength - average >= 90:
      return 1.25;
    case strength - average >= 80:
      return 1.35;
    case strength - average >= 70:
      return 1.45;
    case strength - average >= 60:
      return 1.65;
    case strength - average >= 50:
      return 1.9;
    case strength - average >= 40:
      return 2.1;
    case strength - average >= 30:
      return 2.4;
    case strength - average >= 20:
      return 2.8;
    case strength - average >= 10:
      return 3.7;
    case strength - average >= -10:
      return 4.9;
    case strength - average >= -20:
      return 7;
    case strength - average >= -30:
      return 11;
    case strength - average >= -40:
      return 18;
    case strength - average >= -50:
      return 28;
    case strength - average >= -60:
      return 39;
    case strength - average >= -70:
      return 54;
    case strength - average >= -80:
      return 82;
    case strength - average >= -90:
      return 221;
    case strength - average >= -100:
      return 460;

    default:
      return 1000;
  }
};

const odds = (competition, teams) => {
  const average =
    competition
      .get("teams")
      .map((t) => teams[t])
      .reduce((r, t) => r + t.strength, 0) /
    competition.get("teams").count();

  const odds = competition
    .get("teams")
    .map((t) => teams[t])
    .map((team) => ({
      id: team.id,
      name: team.name,
      odds: getOdds(team.strength, average)
    }));

  return Map(odds.map((o) => [o.id, o]))
    .sortBy((t) => t.name)
    .sortBy((t) => t.odds);
};

export default odds;
