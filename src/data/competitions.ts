import ehl from "./competitions/ehl";
import phl from "./competitions/phl";
import division from "./competitions/division";
import tournaments from "./competitions/tournaments";
import type { CompetitionDefinition } from "../types/competitions";

const competitionEntries: [string, CompetitionDefinition][] = [
  ["phl", phl],
  ["division", division],
  ["ehl", ehl],
  ["tournaments", tournaments]
];

// Sort by weight (ascending) to match the original Immutable Map.sortBy behavior
competitionEntries.sort((a, b) => a[1].data.weight - b[1].data.weight);

const competitions: Record<string, CompetitionDefinition> =
  Object.fromEntries(competitionEntries);

export default competitions;
