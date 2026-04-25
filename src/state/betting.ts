export type ChampionshipBet = {
  manager: string;
  team: number;
  amount: number;
  odds: number;
};

export type Bet = {
  manager: string;
  coupon: string[];
  amount: number;
};

export type BettingState = {
  championshipBets: ChampionshipBet[];
  bets: Bet[];
};
