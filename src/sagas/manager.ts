import { select, put, call, all, takeEvery } from "typed-redux-saga";
import { gameFacts } from "@/services/game";
import competitionList from "@/data/competitions";
import playerTypes from "@/data/transfer-market";
import {
  managersTeam,
  managersTeamId,
  managersDifficulty,
  managerCompetesIn,
  managerHasService,
  teamsMainCompetition
} from "@/selectors";
import { incrementMorale, incrementReadiness, incurPenalty } from "./team";
import { addNotification } from "./notification";
import crisis from "@/data/crisis";
import {
  managerAdd,
  managerSetActive,
  managerSetBalance,
  managerRenameArena,
  managerIncrementBalance,
  managerSetExtra,
  managerSetFlag,
  managerSetArenaLevel,
  managerSetInsuranceExtra,
  managerIncrementInsuranceExtra,
  managerSetService,
  managerBuyPlayer,
  managerSellPlayer
} from "@/ducks/manager";
import type { ManagerServices } from "@/state/manager";
import difficultyLevels from "@/data/difficulty-levels";
import { incrementStrength, decrementStrength } from "./team";
import r from "@/services/random";
import { addAnnouncement } from "./news";
import { amount as a } from "@/services/format";
import { teamRemoveManager, teamAddManager } from "@/ducks/game";
import type { RootState } from "@/config/redux";
import type { CompetitionId } from "@/types/competitions";
import { entries } from "remeda";

type AddManagerDetails = {
  name: string;
  team: string;
  difficulty: string;
  arena: string;
};

export function* addManager(details: AddManagerDetails) {
  const teamId = parseInt(details.team, 10);
  const mainCompetition = yield* select(teamsMainCompetition(teamId));

  const manager = {
    id: crypto.randomUUID(),
    name: details.name,
    difficulty: parseInt(details.difficulty, 10),
    pranksExecuted: 0,
    services: {
      coach: false,
      insurance: false,
      microphone: false,
      cheer: false
    },
    balance: difficultyLevels[parseInt(details.difficulty, 10)].startBalance,
    arena: {
      name: details.arena,
      level: mainCompetition === "phl" ? 3 : 0
    },
    extra: 0,
    insuranceExtra: 0,
    flags: {}
  };

  yield* put(managerAdd({ manager }));

  yield* call(hireManager, manager.id, teamId);
}

export function* setActiveManager(managerId: string) {
  yield* put(managerSetActive(managerId));
}

export function* hireManager(managerId: string, teamId: number) {
  const managersCurrentTeam = yield* select(
    (state: RootState) => state.manager.managers[managerId]?.team
  );

  if (managersCurrentTeam) {
    yield* put(
      teamRemoveManager({
        team: managersCurrentTeam
      })
    );
  }

  yield* put(
    teamAddManager({
      team: teamId,
      manager: managerId
    })
  );
}

export function* setBalance(managerId: string, amount: number) {
  return yield* put(managerSetBalance({ manager: managerId, amount }));
}

export function* renameArena(managerId: string, name: string) {
  return yield* put(managerRenameArena({ manager: managerId, name }));
}

export function* incrementBalance(managerId: string, amount: number) {
  const manager = yield* select(
    (state: RootState) => state.manager.managers[managerId]
  );
  if (!manager) {
    throw new Error(`INVALID MANAGER ${managerId} ${amount}`);
  }

  return yield* put(managerIncrementBalance({ manager: managerId, amount }));
}

export function* decrementBalance(managerId: string, amount: number) {
  return yield* call(incrementBalance, managerId, -amount);
}

export function* setExtra(manager: string, extra: number) {
  yield* put(managerSetExtra({ manager, extra }));
}

export function* setFlag(manager: string, flag: string, value: boolean) {
  yield* put(managerSetFlag({ manager, flag, value }));
}

export function* crisisMeeting(action: { payload: { manager: string } }) {
  const { payload } = action;

  const difficulty = yield* select(managersDifficulty(payload.manager));
  const team = yield* select(managersTeam(payload.manager));
  const competitions = yield* select(
    (state: RootState) => state.game.competitions
  );

  const moraleBoost = difficultyLevels[difficulty].moraleBoost;

  const crisisInfo = crisis(team, competitions);

  const moraleGain = crisisInfo.moraleGain + moraleBoost;

  yield* call(decrementBalance, payload.manager, crisisInfo.amount);
  yield* call(incrementMorale, team.id, moraleGain);

  yield* call(
    addNotification,
    payload.manager,
    `Psykologi valaa yhdessä managerin kanssa uskoa pelaajien mieliin. Moraali paranee (+${moraleGain}), ja joukkue keskittyy tuleviin haasteisiin uudella innolla!`
  );
}

export function* buyPlayer(action: ReturnType<typeof managerBuyPlayer>) {
  const { payload } = action;

  const manager = yield* select(
    (state: RootState) => state.manager.managers[payload.manager]
  );

  const playerType = playerTypes[payload.playerType];
  yield* call(decrementBalance, manager.id, playerType.buy);

  const skillGain = playerType.skill();
  yield* call(incrementStrength, manager.team!, skillGain);

  yield* call(
    addNotification,
    payload.manager,
    `Ostamasi pelaaja tuo ${skillGain} lisää voimaa joukkueeseen!`
  );
}

export function* setArenaLevel(manager: string, level: number) {
  yield* put(
    managerSetArenaLevel({ manager, level: Math.max(0, Math.min(9, level)) })
  );
}

export function* sellPlayer(action: ReturnType<typeof managerSellPlayer>) {
  const {
    payload: { manager: managerId, playerType }
  } = action;

  console.log(managerId, playerType, "fihdh");

  const competesInPhl = yield* select(managerCompetesIn(managerId, "phl"));

  const minStrength = competesInPhl ? 130 : 50;

  const team = yield* select(managersTeam(managerId));

  if (team.strength <= minStrength) {
    return yield* call(
      addNotification,
      managerId,
      "Johtokunnan mielestä pelaajien myynti ei ole ratkaisu tämänhetkisiin ongelmiimme. Myyntilupa evätty.",
      "error"
    );
  }

  const playerDefinition = playerTypes[playerType];
  yield* call(incrementBalance, managerId, playerDefinition.sell);

  const skillGain = playerDefinition.skill();
  yield* call(decrementStrength, team.id, skillGain);

  yield* call(
    addNotification,
    managerId,
    `Myymäsi pelaaja vie ${skillGain} voimaa mukanaan!`
  );
}

export function* setInsuranceExtra(manager: string, value: number) {
  yield* put(managerSetInsuranceExtra({ manager, value }));
}

export function* incrementInsuranceExtra(manager: string, amount: number) {
  yield* put(managerIncrementInsuranceExtra({ manager, amount }));
}

export function* setService(manager: string, service: string, value: boolean) {
  yield* put(managerSetService({ manager, service, value }));
}

export function* toggleService(action: {
  payload: { manager: string; service: keyof ManagerServices };
}) {
  const {
    payload: { manager, service }
  } = action;

  const currentService = yield* select(managerHasService(manager, service));

  yield* call(setService, manager, service, !currentService);
}

export function* afterGameday(
  competition: CompetitionId,
  phase: number,
  groupId: number,
  round: number
) {
  const managers = yield* select((state: RootState) => state.manager.managers);

  const group = yield* select(
    (state: RootState) =>
      state.game.competitions[competition].phases[phase].groups[groupId]
  );

  for (const [managerId, manager] of entries(managers)) {
    const managersIndex = group.teams.findIndex((t) => t === manager.team);

    if (managersIndex === -1) {
      continue;
    }

    const game = group.schedule[round].find((pairing) => {
      return pairing.home === managersIndex || pairing.away === managersIndex;
    });

    if (!game) {
      continue;
    }

    if (!game.result) {
      return;
    }

    const hasMicrophone = yield* select(
      managerHasService(managerId, "microphone")
    );

    if (hasMicrophone) {
      if (["phl", "division"].includes(competition) && phase === 0) {
        const caught = r.bool(0.06);
        if (caught) {
          const amount = 50000;
          const pointDeduction = -4;
          yield* all([
            call(
              addAnnouncement,
              managerId,
              `"Salainen" mikrofonisi vastustajan vaihtoaitiossa on paljastunut. Teidät tuomitaan __${a(
                amount
              )}__ pekan sakkoihin ja __${pointDeduction}__ pisteen menetykseen.`
            ),
            call(decrementBalance, managerId, amount),
            call(incurPenalty, competition, 0, 0, manager.team!, pointDeduction)
          ]);
        }
      }
    }

    const facts = gameFacts(game, managersIndex);
    const team = yield* select(managersTeamId(manager.id));

    const competitionDef = competitionList[competition];

    const amount = competitionDef.gameBalance(phase, facts, manager);

    const moraleBoost = competitionDef.moraleBoost(phase, facts, manager);

    const readinessBoost = competitionDef.readinessBoost(phase, facts, manager);

    if (readinessBoost) {
      yield* call(incrementReadiness, team, readinessBoost);
    }

    if (moraleBoost) {
      yield* call(incrementMorale, team, moraleBoost);
    }

    if (amount) {
      yield* call(incrementBalance, manager.id, amount);
    }
  }
}

export function* watchTransferMarket() {
  yield* all([
    takeEvery(managerBuyPlayer, buyPlayer),
    takeEvery(managerSellPlayer, sellPlayer)
  ]);
}
