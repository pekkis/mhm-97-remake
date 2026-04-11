import type {
  CompetitionId,
  CompetitionSagaDefinition
} from "@/types/competitions";

import { phlSagas } from "@/data/competitions/sagas/phl";
import { ehlSagas } from "@/data/competitions/sagas/ehl";
import { divisionSagas } from "@/data/competitions/sagas/division";
import { tournamentsSagas } from "@/data/competitions/sagas/tournaments";

export const competitionSagas: Record<
  CompetitionId,
  CompetitionSagaDefinition
> = {
  phl: phlSagas,
  ehl: ehlSagas,
  division: divisionSagas,
  tournaments: tournamentsSagas
};
