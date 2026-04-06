import { roundRobin } from "./round-robin";
import { Map } from "immutable";

const tournamentScheduler = (numberOfTeams) => {
  return roundRobin(numberOfTeams).map((round) => {
    return round.map((pairing) => {
      return Map({
        home: pairing[0],
        away: pairing[1]
      });
    });
  });
};

export default tournamentScheduler;
