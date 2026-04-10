import { put, all, call, select } from "typed-redux-saga";
import { BETTING_BET_CHAMPION, BETTING_BET } from "../ducks/betting";
import type { SeasonStats } from "../ducks/stats";
import type { RootState } from "../config/redux";
import type { Pairing } from "../types/competitions";
import { decrementBalance, incrementBalance } from "./manager";
import { addAnnouncement } from "./news";
import { amount as a } from "../services/format";
import { addNotification } from "./notification";
import { resultFacts } from "../services/game";

const victories = [false, false, false, 1, 2, 5, 10] as const;

export function* processChampionBets() {
  const bets = yield* select((state: RootState) => state.betting.championshipBets);
  const stats = yield* select(
    (state: RootState) => state.stats.currentSeason as SeasonStats
  );

  console.log("stats", stats);

  const champion = stats.medalists![0];

  for (const bet of bets) {
    if (bet.team === champion) {
      const amount = Math.round(bet.amount * bet.odds);
      yield* call(incrementBalance, bet.manager, amount);
      yield* call(
        addAnnouncement,
        bet.manager,
        `Voitit __${a(amount)}__ pekkaa mestariveikkauksessa. Hyvin veikattu!`
      );
    }
  }
}

export function* bettingResults(round: number) {
  const pairings: Pairing[] = yield* select(
    (state: RootState) =>
      state.game.competitions.phl.phases[0].groups[0].schedule[round]
  );

  const facts = pairings.map((p) => resultFacts(p.result!, "home"));
  const correctCoupon = facts.map((f) => {
    if (f.isWin) {
      return "1";
    } else if (f.isDraw) {
      return "x";
    }
    return "2";
  });

  console.log("CORRETTI", correctCoupon);

  const bets = yield* select((state: RootState) => state.betting.bets);

  for (const bet of bets) {
    const correct = bet.coupon.filter((c, i) => c === correctCoupon[i]).length;

    const victory = victories[correct];
    if (victory) {
      const victoryAmount = Math.round(victory * bet.amount);
      yield* all([
        call(incrementBalance, bet.manager, victoryAmount),
        call(
          addAnnouncement,
          bet.manager,
          `Voitit kavioveikkauksessa __${a(
            victoryAmount
          )}__ pekkaa. Rivissäsi oli __${correct}__ oikein. Panoksesi oli __${a(
            bet.amount
          )}__ pekkaa.`
        )
      ]);
    } else {
      yield* call(
        addAnnouncement,
        bet.manager,
        `Et voittanut kavioveikkauksessa. Rivissäsi oli __${correct}__ oikein. Panoksesi oli __${a(
          bet.amount
        )}__ pekkaa.`
      );
    }
  }
}

export function* bet(manager: string, coupon: string[], amount: number) {
  console.log("BETTING", manager, coupon, amount);
  yield* all([
    call(
      addNotification,
      manager,
      "Kiikutat veikkauskuponkisi lähimmälle S-kioskille. Olkoon onni myötä!"
    ),
    put({
      type: BETTING_BET,
      payload: {
        manager,
        coupon,
        amount
      }
    }),
    call(decrementBalance, manager, amount)
  ]);
}

export function* betChampion(
  manager: string,
  team: number,
  amount: number,
  odds: number
) {
  yield* all([
    call(
      addNotification,
      manager,
      "Kiikutat mestarusveikkauskuponkisi S-kioskille. Olkoon onni myötä!"
    ),
    put({
      type: BETTING_BET_CHAMPION,
      payload: {
        manager,
        team,
        amount,
        odds
      }
    }),
    call(decrementBalance, manager, amount)
  ]);
}
