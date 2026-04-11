import { produce } from "immer";
import { createAction } from "@reduxjs/toolkit";
import { SEASON_START } from "./game";

export type ManagerArena = {
  name: string;
  level: number;
};

export type ManagerServices = {
  coach: boolean;
  insurance: boolean;
  microphone: boolean;
  cheer: boolean;
};

export type Manager = {
  id: string;
  name: string;
  difficulty: number;
  pranksExecuted: number;
  services: ManagerServices;
  balance: number;
  arena: ManagerArena;
  extra: number;
  insuranceExtra: number;
  flags: Record<string, boolean>;
  team?: number;
};

export type ManagerState = {
  active: string | undefined;
  managers: Record<string, Manager>;
};

const defaultState: ManagerState = {
  active: undefined,
  managers: {}
};

// State-changing actions (hit reducer)
export const managerAdd = createAction<{ manager: Manager }>("MANAGER_ADD");
export const managerSetActive = createAction<string>("MANAGER_SET_ACTIVE");
export const managerSetBalance = createAction<{
  manager: string;
  amount: number;
}>("MANAGER_SET_BALANCE");
export const managerRenameArena = createAction<{
  manager: string;
  name: string;
}>("MANAGER_RENAME_ARENA");
export const managerIncrementBalance = createAction<{
  manager: string;
  amount: number;
}>("MANAGER_INCREMENT_BALANCE");
export const managerDecrementBalance = createAction<{
  manager: string;
  amount: number;
}>("MANAGER_DECREMENT_BALANCE");
export const managerSetExtra = createAction<{ manager: string; extra: number }>(
  "MANAGER_SET_EXTRA"
);
export const managerSetFlag = createAction<{
  manager: string;
  flag: string;
  value: boolean;
}>("MANAGER_SET_FLAG");
export const managerSetArenaLevel = createAction<{
  manager: string;
  level: number;
}>("MANAGER_SET_ARENA_LEVEL");
export const managerSetInsuranceExtra = createAction<{
  manager: string;
  value: number;
}>("MANAGER_SET_INSURANCE_EXTRA");
export const managerIncrementInsuranceExtra = createAction<{
  manager: string;
  amount: number;
}>("MANAGER_INCREMENT_INSURANCE_EXTRA");
export const managerSetService = createAction<{
  manager: string;
  service: string;
  value: boolean;
}>("MANAGER_SET_SERVICE");

// Request actions (saga-intercepted, not in reducer)
export const managerToggleService = createAction<{
  manager: string;
  service: string;
}>("MANAGER_TOGGLE_SERVICE");
export const managerBuyPlayer = createAction<{
  manager: string;
  playerType: string;
}>("MANAGER_BUY_PLAYER");
export const managerSelectStrategy = createAction<{
  manager: string;
  strategy: number;
}>("MANAGER_SELECT_STRATEGY");
export const managerImproveArena = createAction<{ manager: string }>(
  "MANAGER_IMPROVE_ARENA"
);
export const managerSellPlayer = createAction<{
  manager: string;
  playerType: string;
}>("MANAGER_SELL_PLAYER");
export const managerCrisisMeeting = createAction<{ manager: string }>(
  "MANAGER_CRISIS_MEETING"
);

export default function managerReducer(
  state: ManagerState = defaultState,
  action: any
): ManagerState {
  const { type, payload } = action;

  switch (type) {
    case "META_QUIT_TO_MAIN_MENU":
      return defaultState;

    case "META_GAME_LOAD_STATE":
      return payload.manager;

    case SEASON_START:
      return produce(state, (draft) => {
        for (const manager of Object.values(draft.managers)) {
          manager.pranksExecuted = 0;
          manager.flags.rally = false;
        }
      });

    case "MANAGER_SET_FLAG":
      return produce(state, (draft) => {
        draft.managers[payload.manager].flags[payload.flag] = payload.value;
      });

    case "MANAGER_SET_SERVICE":
      return produce(state, (draft) => {
        (draft.managers[payload.manager].services as any)[payload.service] =
          payload.value;
      });

    case "MANAGER_INCREMENT_BALANCE":
      return produce(state, (draft) => {
        draft.managers[payload.manager].balance += payload.amount;
      });

    case "MANAGER_SET_BALANCE":
      return produce(state, (draft) => {
        draft.managers[payload.manager].balance = payload.amount;
      });

    case "MANAGER_DECREMENT_BALANCE":
      return produce(state, (draft) => {
        draft.managers[payload.manager].balance -= payload.amount;
      });

    case "TEAM_REMOVE_MANAGER": {
      return produce(state, (draft) => {
        const mgr = Object.values(draft.managers).find(
          (m) => m.team === payload.team
        );
        if (mgr) {
          delete mgr.team;
        }
      });
    }

    case "TEAM_ADD_MANAGER":
      return produce(state, (draft) => {
        draft.managers[payload.manager].team = payload.team;
      });

    case "MANAGER_INCREMENT_INSURANCE_EXTRA":
      return produce(state, (draft) => {
        draft.managers[payload.manager].insuranceExtra += payload.amount;
      });

    case "MANAGER_SET_EXTRA":
      return produce(state, (draft) => {
        draft.managers[payload.manager].extra = payload.extra;
      });

    case "MANAGER_SET_INSURANCE_EXTRA":
      return produce(state, (draft) => {
        draft.managers[payload.manager].insuranceExtra = payload.value;
      });

    case "MANAGER_ADD":
      return produce(state, (draft) => {
        draft.managers[payload.manager.id] = payload.manager;
      });

    case "MANAGER_RENAME_ARENA":
      return produce(state, (draft) => {
        draft.managers[payload.manager].arena.name = payload.name;
      });

    case "MANAGER_SET_ARENA_LEVEL":
      return produce(state, (draft) => {
        draft.managers[payload.manager].arena.level = payload.level;
      });

    case "MANAGER_SET_ACTIVE":
      return produce(state, (draft) => {
        draft.active = payload;
      });

    case "PRANK_ORDER":
      return produce(state, (draft) => {
        draft.managers[payload.manager].pranksExecuted += 1;
      });

    default:
      return state;
  }
}
