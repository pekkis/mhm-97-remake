import { roundRobin } from "./round-robin";
import { Map, List } from "immutable";

const tournamentScheduler = (numberOfTeams: number) => {
  return List(
    roundRobin(numberOfTeams).map((round) => {
      return List(
        round.map((pairing) => {
          return Map({
            home: pairing[0],
            away: pairing[1]
          });
        })
      );
    })
  );
};

export default tournamentScheduler;
