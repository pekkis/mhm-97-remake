import r from "../services/random";
import { victors } from "../services/playoffs";
import type { RootState } from "../config/redux";
import type { GameFlags, Team } from "../ducks/game";
import type { Manager, ManagerServices } from "../ducks/manager";
import type {
  CompetitionId,
  PlayoffGroup,
  TeamStat
} from "../types/competitions";

type Selector<T> = (state: RootState) => T;

export const foreignTeams = (state: RootState) =>
  state.game.teams.filter((t) => !t.domestic);

export const totalGamesPlayed =
  (
    manager: string,
    competition: string,
    phase: number
  ): Selector<number | undefined> =>
  (state) => {
    const stats =
      state.stats.managers?.[manager]?.games?.[competition]?.[phase];

    if (!stats) {
      return 0;
    }

    return undefined;
    // const phlGamesPlayed = stats.reduce((r, s) => r + s, 0);
  };

export const teamsManagerId =
  (team: number): Selector<string | undefined> =>
  (state) =>
    state.game.teams[team]?.manager;

export const teamsManager =
  (team: number): Selector<Manager | undefined> =>
  (state) => {
    const managerId = state.game.teams[team]?.manager;
    return managerId ? state.manager.managers[managerId] : undefined;
  };

export const managerObject =
  (manager: string): Selector<Manager | undefined> =>
  (state) => {
    const managerObj = state.manager.managers[manager];
    if (!managerObj) {
      throw new Error(`Manager #${manager} not found`);
    }

    return state.manager.managers[manager];
  };

export const managersMainCompetition =
  (manager: string): Selector<string> =>
  (state) => {
    const competesInPHL = managerCompetesIn(manager, "phl")(state);
    return competesInPHL ? "phl" : "division";
  };

export const teamsMainCompetition =
  (team: number): Selector<string> =>
  (state) => {
    console.log("team", team);

    const competesInPHL = teamCompetesIn(team, "phl")(state);
    return competesInPHL ? "phl" : "division";
  };

export const managerById =
  (manager: string): Selector<Manager | undefined> =>
  (state) =>
    state.manager.managers[manager];

export const managersCompetitions = (manager: string) => (state: RootState) => {
  const team = state.manager.managers[manager]?.team;
  if (team === undefined) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(state.game.competitions).filter(([, c]) =>
      c.teams.includes(team)
    )
  );
};

export const teamsStrength =
  (team: number): Selector<number> =>
  (state) =>
    state.game.teams[team].strength;

export const teamWasRelegated =
  (team: number): Selector<boolean> =>
  (state) => {
    const phlStats = state.game.competitions.phl.phases[0].groups[0]
      .stats as TeamStat[];
    const phlLoser = phlStats[phlStats.length - 1].id;

    if (phlLoser !== team) {
      return false;
    }

    const divisionVictor = victors(
      state.game.competitions.division.phases[3].groups[0] as PlayoffGroup
    )[0].id;

    if (divisionVictor === team) {
      return false;
    }

    return true;
  };

export const teamWasPromoted =
  (team: number): Selector<boolean> =>
  (state) => {
    const competesInDivision = teamCompetesIn(team, "division")(state);
    if (!competesInDivision) {
      return false;
    }

    const divisionVictor = victors(
      state.game.competitions.division.phases[3].groups[0] as PlayoffGroup
    )[0].id;

    if (divisionVictor === team) {
      return true;
    }

    return false;
  };

export const teamsPositionInRoundRobin =
  (
    team: number,
    competitionId: string,
    phase: number
  ): Selector<number | false> =>
  (state) => {
    const thePhase = state.game.competitions[competitionId].phases[phase];

    const group = thePhase.groups.find((g) => g.teams.includes(team));

    if (!group) {
      return false;
    }

    const index = (group.stats as TeamStat[]).findIndex((e) => e.id === team);

    if (index === -1) {
      return false;
    }

    return index + 1;
  };

export const teamCompetesIn =
  (team: number, competitionId: string): Selector<boolean> =>
  (state) => {
    const comps = teamsCompetitions(team)(state);
    return competitionId in comps;
  };

export const teamsCompetitions = (team: number) => (state: RootState) => {
  return Object.fromEntries(
    Object.entries(state.game.competitions).filter(([, c]) =>
      (c.teams ?? []).includes(team)
    )
  );
};

export const teamHasActiveEffects =
  (team: number): Selector<boolean> =>
  (state) => {
    return state.game.teams[team].effects.length > 0;
  };

export const allTeams: Selector<Team[]> = (state: RootState) =>
  state.game.teams;

export const pekkalandianTeams = (state: RootState) =>
  state.game.teams.slice(0, 24);

export const managerHasService =
  (manager: string, service: keyof ManagerServices): Selector<boolean> =>
  (state) => {
    return state.manager.managers[manager]?.services?.[service];
  };

export const managerWhoControlsTeam =
  (id: number): Selector<Manager | undefined> =>
  (state) => {
    return Object.values(state.manager.managers).find((p) => p.team === id);
  };

export const competition = (id: CompetitionId) => (state: RootState) =>
  state.game.competitions[id];

export const managerCompetesIn =
  (manager: string, competitionId: string): Selector<boolean> =>
  (state) => {
    const competitions = managersCompetitions(manager)(state);
    return competitionId in competitions;
  };

export const flag =
  <K extends keyof GameFlags>(f: K) =>
  (state: RootState): GameFlags[K] =>
    state.game.flags[f];

export const managerFlag =
  (manager: string, flag: string) => (state: RootState) =>
    state.manager.managers[manager]?.flags?.[flag];

export const managersTeam =
  (manager: string): Selector<Team> =>
  (state) =>
    state.game.teams[state.manager.managers[manager]?.team!];

export const managersBalance =
  (manager: string): Selector<number> =>
  (state) =>
    state.manager.managers[manager].balance;

export const managersTeamId =
  (manager: string): Selector<number> =>
  (state) => {
    return managersTeam(manager)(state).id;
  };

export const managersDifficulty =
  (manager: string): Selector<number> =>
  (state) =>
    state.manager.managers[manager]?.difficulty as number;

export const randomRankedTeam =
  (
    competitionId: string,
    phaseId: number,
    range: number[],
    f: (t: Team) => boolean = () => true
  ): Selector<Team | false> =>
  (state) => {
    const managerIds = Object.keys(state.manager.managers);

    const groups =
      state.game.competitions[competitionId].phases[phaseId].groups;

    const ret: Team[] = groups.flatMap((group) => {
      return (group.stats as TeamStat[])
        .filter((_s, i) => range.includes(i))
        .map((s) => state.game.teams[s.id])
        .filter((t) => !managerIds.includes(t.manager!))
        .filter(f);
    });

    if (ret.length === 0) {
      return false;
    }

    const randomized: Team = r.pick(ret);
    return state.game.teams[randomized.id];
  };

export const randomTeamFrom =
  (
    competitionIds: string[],
    canBeHumanControlled = false,
    excluded: number[] = [],
    f: (t: Team) => boolean = () => true
  ): Selector<Team> =>
  (state) => {
    console.log(excluded, "excommunicado");

    const managersTeams: number[] = Object.values(state.manager.managers)
      .map((p) => p.team)
      .filter((t): t is number => t !== undefined);

    const teams = Object.entries(state.game.competitions)
      .filter(([id]) => competitionIds.includes(id))
      .flatMap(([, c]) => c.teams)
      .map((t) => state.game.teams[t])
      .filter((t) => {
        console.log("T", t);
        return canBeHumanControlled || !managersTeams.includes(t.id);
      })
      .filter((t) => !excluded.includes(t.id))
      .filter(f);

    if (teams.length === 0) {
      throw new Error("Could not find a team!");
    }

    const randomized: Team = r.pick(teams);
    return state.game.teams[randomized.id];
  };

export const interestingCompetitions =
  (manager: string) => (state: RootState) => {
    const team = managersTeam(manager)(state);

    return Object.keys(state.game.competitions).filter((id) => {
      const comp = state.game.competitions[id];
      return comp.phases.some((phase) =>
        phase.groups.some((group) => group.teams.includes(team.id))
      );
    });
  };

export const randomManager =
  (exclude: number[] = []) =>
  (state: RootState) => {
    // Psycho event filter out.
    const psycho = flag("psycho")(state);
    const managers = state.game.managers
      .filter((m) => m.id !== psycho)
      .filter((m) => !exclude.includes(m.id));

    const random = r.pick(managers);
    return random;
  };

export const managersArena = (manager: string) => (state: RootState) => {
  return state.manager.managers[manager]?.arena;
};

export const managerHasEnoughMoney =
  (manager: string, neededAmount: number): Selector<boolean> =>
  (state) => {
    const amount = state.manager.managers[manager].balance;
    return neededAmount <= amount;
  };

export const managerWithId =
  (id: string): Selector<Manager | undefined> =>
  (state) =>
    state.manager.managers[id];
