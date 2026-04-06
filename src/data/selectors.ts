import { pipe } from "remeda";
import r from "../services/random";
import { victors } from "../services/playoffs";
import { List, type Map } from "immutable";
import type { RootState } from "../config/redux";
import type { Team } from "../ducks/game";

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
    state.manager.getIn([
      "managers",
      state.game.teams[team]?.manager
    ]);

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
  return state.game.competitions.filter((c: Map<string, any>) => {
    return c
      .get("teams")
      .includes(state.manager.getIn(["managers", manager, "team"]));
  });
};

export const teamsStrength =
  (team: number): Selector<number> =>
  (state) =>
    state.game.teams[team].strength;

export const teamWasRelegated =
  (team: number): Selector<boolean> =>
  (state) => {
    const phlLoser = (
      state.game.competitions.getIn(["phl",
        "phases",
        0,
        "groups",
        0,
        "stats"
      ]) as any
    )
      .last()
      .get("id");

    if (phlLoser !== team) {
      return false;
    }

    const divisionVictor = victors(
      state.game.competitions.getIn(["division", "phases", 3, "groups", 0])
    )
      .first()
      .get("id");

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
      state.game.competitions.getIn(["division", "phases", 3, "groups", 0])
    )
      .first()
      .get("id");

    if (divisionVictor === team) {
      return true;
    }

    return false;
  };

export const teamsPositionInRoundRobin =
  (
    team: number,
    competition: string,
    phase: number
  ): Selector<number | false> =>
  (state) => {
    const thePhase: any = state.game.competitions.getIn([competition,
      "phases",
      phase
    ]);

    const group = thePhase
      .get("groups")
      .find((group: Map<string, any>) => group.get("teams").includes(team));

    if (!group) {
      return false;
    }

    const index = group
      .get("stats")
      .findIndex((e: Map<string, any>) => e.get("id") === team);

    if (index === -1) {
      return false;
    }

    return index + 1;
  };

export const teamCompetesIn =
  (team: number, competition: string): Selector<boolean> =>
  (state) => {
    return pipe(teamsCompetitions(team)(state), (competitions: any) => {
      return competitions
        .map((c: Map<string, any>) => c.get("id"))
        .includes(competition);
    });
  };

export const teamsCompetitions = (team: number) => (state: RootState) => {
  return state.game.competitions.filter((c: Map<string, any>) => {
    return c.get("teams", List()).includes(team);
  });
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
  state.game.competitions.getIn([id]);

export const managerCompetesIn =
  (manager: string, competition: string): Selector<boolean> =>
  (state) => {
    const competitions = managersCompetitions(manager)(state);
    return competitions
      .map((c: Map<string, any>) => c.get("id"))
      .includes(competition);
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
    const managers = state.manager
      .get("managers")
      .map((m: ImmutableManager) => m.get("id"));

    const ret = (
      state.game.competitions.getIn([competitionId,
        "phases",
        phaseId,
        "groups"
      ]) as any
    ).flatMap((group: Map<string, any>) => {
      console.log(group, "g");

      return group
        .get("stats")
        .map((s: Map<string, any>) => s.get("id"))
        .filter((_t: any, i: number) => range.includes(i))
        .map((t: number) => state.game.teams[t])
        .filterNot((t: Team) => managers.includes(t.manager))
        .filter(f);
    });

    console.log(ret.toJS(), "wut the fuk?");

    if (ret.count() === 0) {
      return false;
    }

    const randomized: Team = r.pick(ret.toArray());
    return state.game.teams[randomized.id];
  };

export const randomTeamFrom =
  (
    competitions: string[],
    canBeHumanControlled = false,
    excluded: number[] = [],
    f: (t: Team) => boolean = () => true
  ): Selector<Team> =>
  (state) => {
    console.log(excluded, "excommunicado");

    const managersTeams = state.manager
      .get("managers")
      .map((p: ImmutableManager) => p.get("team"));

    const teams = state.game.competitions
      .toList()
      .filter((c: Map<string, any>) => competitions.includes(c.get("id")))
      .map((c: Map<string, any>) => c.get("teams"))
      .flatten(true)
      .map((t: any) => state.game.teams[t])
      .filter((t: Team) => {
        console.log("T", t);
        return canBeHumanControlled || !managersTeams.includes(t.id);
      })
      .filterNot((t: Team) => excluded.includes(t.id))
      .filter(f);

    if (teams.count() === 0) {
      throw new Error("Could not find a team!");
    }

    const randomized: Team = r.pick(teams.toArray());
    return state.game.teams[randomized.id];
  };

export const interestingCompetitions =
  (manager: string) => (state: RootState) => {
    const team = managersTeam(manager)(state);

    return state.game.competitions
      .filter((competition: Map<string, any>) => {
        return competition.get("phases").some((phase: Map<string, any>) => {
          return phase
            .get("groups")
            .some((group: Map<string, any>) =>
              group.get("teams").includes(team.id)
            );
        });
      })
      .map((c: Map<string, any>) => c.get("id"));
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
