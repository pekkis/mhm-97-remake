import { Map, List } from "immutable";
import rr from "../../services/round-robin";
import playoffScheduler, { victors, eliminated } from "../../services/playoffs";
import { defaultMoraleBoost } from "../../services/morale";
import r from "../../services/random";

export default Map({
  data: Map({
    weight: 500,
    id: "phl",
    abbr: "phl",
    phase: -1,
    name: "PHL",
    teams: List.of(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11),
    phases: List()
  }),

  gameBalance: (phase, facts, manager) => {
    const arenaLevel = manager.getIn(["arena", "level"]) + 1;
    if (facts.isLoss) {
      return manager.get("extra");
    }

    if (facts.isDraw) {
      return 5000 + 3000 * arenaLevel + manager.get("extra");
    }

    return 10000 + 3000 * arenaLevel + manager.get("extra");
  },

  moraleBoost: (phase, facts, manager) => {
    return defaultMoraleBoost(facts);
  },

  readinessBoost: (phase, facts, manager) => {
    return 0;
  },

  relegateTo: "division",
  promoteTo: false,

  parameters: Map({
    gameday: phase => ({
      advantage: Map({
        home: team => 10,
        away: team => -10
      }),
      base: () => 20,
      moraleEffect: team => {
        return team.get("morale") * 2;
      }
    })
  }),

  seed: List.of(
    competitions => {
      const competition = competitions.get("phl");
      const teams = competition.get("teams").sortBy(() => r.real(1, 1000));
      const times = 2;
      return Map({
        name: "runkosarja",
        type: "round-robin",
        teams,
        groups: List.of(
          Map({
            penalties: List(),
            type: "round-robin",
            round: 0,
            name: "runkosarja",
            teams,
            times,
            schedule: rr(teams.count(), times),
            colors: List.of(
              "d",
              "d",
              "d",
              "d",
              "d",
              "d",
              "d",
              "d",
              "l",
              "l",
              "l",
              "d"
            )
          })
        )
      });
    },
    competitions => {
      const teams = competitions
        .getIn(["phl", "phases", 0, "groups", 0, "stats"])
        .take(8)
        .map(e => e.get("id"));

      const winsToAdvance = 3;
      const matchups = List.of(
        List.of(0, 7),
        List.of(1, 6),
        List.of(2, 5),
        List.of(3, 4)
      );

      return Map({
        name: "quarterfinals",
        type: "playoffs",
        teams,
        groups: List.of(
          Map({
            type: "playoffs",
            round: 0,
            teams,
            winsToAdvance,
            matchups,
            schedule: playoffScheduler(matchups, 3)
          })
        )
      });
    },
    competitions => {
      const teams = victors(
        competitions.getIn(["phl", "phases", 1, "groups", 0])
      ).map(t => t.get("id"));

      const matchups = List.of(List.of(0, 3), List.of(1, 2));

      const winsToAdvance = 3;

      return Map({
        name: "semifinals",
        type: "playoffs",
        teams,
        groups: List.of(
          Map({
            type: "playoffs",
            round: 0,
            teams,
            matchups,
            winsToAdvance,
            schedule: playoffScheduler(matchups, winsToAdvance)
          })
        )
      });
    },
    competitions => {
      const teams = victors(
        competitions.getIn(["phl", "phases", 2, "groups", 0])
      )
        .map(t => t.get("id"))
        .concat(
          eliminated(competitions.getIn(["phl", "phases", 2, "groups", 0])).map(
            t => t.get("id")
          )
        );

      const matchups = List.of(List.of(0, 1), List.of(2, 3));

      const winsToAdvance = 4;

      return Map({
        name: "finals",
        type: "playoffs",
        teams,
        groups: List.of(
          Map({
            type: "playoffs",
            teams,
            round: 0,
            matchups,
            winsToAdvance,
            schedule: playoffScheduler(matchups, winsToAdvance)
          })
        )
      });
    }
  )
});
