import { Range } from "immutable";
import scheduler, { roundRobin } from "./services/round-robin";

const x = 12;
const n = 8;

const r = scheduler(12, 2);

console.log(JSON.stringify(r, null, 2));

// const r = roundRobin(x);

const lussi = Range(1, x + 1)
  .toList()
  .map((i) => {
    return r.reduce(
      (counts, round) => {
        const pairing = round.find((pairing) => pairing.home === i || pairing.away === i);
        if (!pairing) {
          return counts;
        }

        if (pairing.home === i) {
          return {
            home: counts.home + 1,
            away: counts.away
          };
        } else {
          return {
            home: counts.home,
            away: counts.away + 1
          };
        }
      },
      { home: 0, away: 0 }
    );
  });

console.log(lussi.toJS());

const poop = r.map((round) => {
  return round.filter((p) => p.home === n || p.away === n);
});

// console.log("schedule length", schedule.count());

// console.log("s", rr);

console.log("p1", poop.toJS());
