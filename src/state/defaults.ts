/**
 * Default factory for a fresh `GameContext`.
 *
 * Mirrors the per-duck `defaultState` values currently scattered across
 * `src/ducks/*`. Used as the initial `context` of `appMachine` and as
 * the reset target on quit-to-menu.
 *
 * Some defaults call into pure functions that read `RandomService` (team
 * strengths, country strengths). That keeps existing behavior; the
 * deterministic seed mechanism (`VITE_RANDOM_SEED`) still works.
 */

import { entries, values } from "remeda";

import teamDefs from "@/data/teams";
import managerDefs from "@/data/managers";
import competitionList from "@/data/competitions";
import { countries as countryList } from "@/data/countries";

import type { GameContext } from "./game-context";
import type { Country } from "./country";
import type { Competition, CompetitionId } from "@/types/competitions";

export const createDefaultGameContext = (): GameContext => ({
  // game
  turn: { season: 0, round: 0, phase: undefined },
  flags: {
    jarko: false,
    usa: false,
    canada: false,
    haanperaMarried: false,
    mauto: false,
    psycho: undefined,
  },
  serviceBasePrices: {
    insurance: 1000,
    coach: 3200,
    microphone: 500,
    cheer: 3000,
  },
  managers: managerDefs,
  competitions: Object.fromEntries(
    entries(competitionList).map(([key, def]) => [key, { ...def.data }]),
  ) as Record<CompetitionId, Competition>,
  teams: teamDefs.map((t) => ({
    id: t.id,
    name: t.name,
    strength: t.strength(),
    domestic: t.domestic,
    morale: 0,
    strategy: 2,
    readiness: 0,
    effects: [],
    opponentEffects: [],
  })),
  worldChampionshipResults: undefined,

  // manager
  manager: { active: undefined, managers: {} },

  // betting
  betting: { championshipBets: [], bets: [] },

  // event
  event: { events: {} },

  // news
  news: { news: [], announcements: {} },

  // notification
  notification: { notifications: [] },

  // prank
  prank: { pranks: [] },

  // stats
  stats: {
    managers: {},
    currentSeason: undefined,
    seasons: [],
    streaks: { team: {}, manager: {} },
  },

  // invitation
  invitation: { invitations: [] },

  // country
  country: {
    countries: values(countryList).reduce(
      (acc, country) => {
        acc[country.iso] = {
          iso: country.iso,
          name: country.name,
          strength: country.strength(),
        };
        return acc;
      },
      {} as Record<string, Country>,
    ),
  },
});
