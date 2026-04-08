import { produce } from "immer";
import { SEASON_START } from "./game";

export const MANAGER_NEXT = "MANAGER_NEXT";

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

export const toggleService = (manager: string, service: string) => {
  return {
    type: "MANAGER_TOGGLE_SERVICE",
    payload: {
      manager,
      service
    }
  };
};

export const buyPlayer = (manager: string, playerType: string) => {
  return {
    type: "MANAGER_BUY_PLAYER",
    payload: {
      manager,
      playerType
    }
  };
};

export const selectStrategy = (manager: string, strategy: number) => {
  return {
    type: "MANAGER_SELECT_STRATEGY",
    payload: {
      manager,
      strategy
    }
  };
};

export const improveArena = (manager: string) => {
  return {
    type: "MANAGER_IMPROVE_ARENA",
    payload: {
      manager
    }
  };
};

export const sellPlayer = (manager: string, playerType: string) => {
  return {
    type: "MANAGER_SELL_PLAYER",
    payload: {
      manager,
      playerType
    }
  };
};

export const crisisMeeting = (manager: string) => {
  return {
    type: "MANAGER_CRISIS_MEETING",
    payload: {
      manager
    }
  };
};

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
