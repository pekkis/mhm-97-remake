export type ChampionshipBet = {
  manager: string;
  team: number;
  amount: number;
  odds: number;
};

export type BettingState = {
  championshipBets: ChampionshipBet[];
};
