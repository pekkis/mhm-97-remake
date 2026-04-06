import { pipe } from "remeda";
import r from "../services/random";
import { victors } from "../services/playoffs";
import { List, type Map } from "immutable";
import type { RootState } from "../config/redux";
import type { Team } from "../ducks/game";
import type {
  Competition,
  PlayoffGroup,
  TeamStat
} from "../types/competitions";

/**
 * Immutable Map representing a manager in the manager state.
 */
type ImmutableManager = Map<string, any>;

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
    const stats = state.stats.getIn([
      "managers",
      manager,
      "games",
      competition,
      phase
    ]);

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
  (team: number): Selector<ImmutableManager | undefined> =>
  (state) =>
    state.manager.getIn(["managers", state.game.teams[team]?.manager]);

export const managerObject =
  (manager: string): Selector<ImmutableManager | undefined> =>
  (state) =>
    state.manager.getIn(["managers", manager]);

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
  (manager: string): Selector<ImmutableManager | undefined> =>
  (state) =>
    state.manager.getIn(["managers", manager]);

export const managersCompetitions = (manager: string) => (state: RootState) => {
  const team = state.manager.getIn(["managers", manager, "team"]);
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

export const allTeams = (state: RootState) => state.game.teams;

export const pekkalandianTeams = (state: RootState) =>
  state.game.teams.slice(0, 24);

export const managerHasService =
  (manager: string, service: string): Selector<boolean> =>
  (state) => {
    return state.manager.getIn(["managers", manager, "services", service]);
  };

export const managerWhoControlsTeam =
  (id: number): Selector<ImmutableManager | undefined> =>
  (state) => {
    return state.manager
      .get("managers")
      .find((p: ImmutableManager) => p.get("team") === id);
  };

export const competition = (id: string) => (state: RootState) =>
  state.game.competitions[id];

export const managerCompetesIn =
  (manager: string, competitionId: string): Selector<boolean> =>
  (state) => {
    const competitions = managersCompetitions(manager)(state);
    return competitionId in competitions;
  };

export const flag = (flag: string) => (state: RootState) => {
  return state.game.flags[flag];
};

export const managerFlag =
  (manager: string, flag: string) => (state: RootState) =>
    state.manager.getIn(["managers", manager, "flags", flag]);

export const managersTeam =
  (manager: string): Selector<Team> =>
  (state) =>
    state.game.teams[state.manager.getIn(["managers", manager, "team"])];

export const managersBalance =
  (manager: string): Selector<number> =>
  (state) =>
    state.manager.getIn(["managers", manager, "balance"]) as number;

export const managersTeamId =
  (manager: string): Selector<number> =>
  (state) => {
    return managersTeam(manager)(state).id;
  };

export const managersDifficulty =
  (manager: string): Selector<number> =>
  (state) =>
    state.manager.getIn(["managers", manager, "difficulty"]) as number;

export const randomRankedTeam =
  (
    competitionId: string,
    phaseId: number,
    range: number[],
    f: (t: Team) => boolean = () => true
  ): Selector<Team | false> =>
  (state) => {
    const managerIds: string[] = [];
    state.manager.get("managers").forEach((m: ImmutableManager) => {
      managerIds.push(m.get("id"));
    });

    const groups =
      state.game.competitions[competitionId].phases[phaseId].groups;

    const ret: Team[] = groups.flatMap((group) => {
      console.log(group, "g");

      return (group.stats as TeamStat[])
        .filter((_s, i) => range.includes(i))
        .map((s) => state.game.teams[s.id])
        .filter((t) => !managerIds.includes(t.manager!))
        .filter(f);
    });

    console.log(ret, "wut the fuk?");

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

    const managersTeams: number[] = [];
    state.manager.get("managers").forEach((p: ImmutableManager) => {
      managersTeams.push(p.get("team"));
    });

    const teams: Team[] = Object.entries(state.game.competitions)
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
  (exclude: string[] = []): Selector<ImmutableManager> =>
  (state) => {
    // Psycho event filter out.
    const psycho = flag("psycho")(state);
    const managers = state.game.managers
      .filterNot((m: ImmutableManager) => m.get("id") === psycho)
      .filterNot((m: ImmutableManager) => exclude.includes(m.get("id")));

    const random: ImmutableManager = r.pick(managers.toArray());
    return random;
  };

export const managersArena = (manager: string) => (state: RootState) => {
  return state.manager.getIn(["managers", manager, "arena"]);
};

export const managerHasEnoughMoney =
  (manager: string, neededAmount: number): Selector<boolean> =>
  (state) => {
    const amount = state.manager.getIn(["managers", manager, "balance"]);
    return neededAmount <= amount;
  };

export const managerWithId =
  (id: string): Selector<ImmutableManager | undefined> =>
  (state) =>
    state.manager.getIn(["managers", id]);
