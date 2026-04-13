import { createAction, createReducer } from "@reduxjs/toolkit";
import { seasonStart, teamRemoveManager, teamAddManager, syncFromMachine } from "./game";
import { quitToMainMenu, gameLoadState } from "./meta";
import { orderPrank } from "./prank";
import { values } from "remeda";

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
  service: keyof ManagerServices;
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

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(quitToMainMenu, () => defaultState)
    .addCase(gameLoadState, (_state, action) => action.payload.manager)
    .addCase(syncFromMachine, (_state, action) => action.payload.manager)
    .addCase(seasonStart, (state) => {
      for (const manager of values(state.managers)) {
        manager.pranksExecuted = 0;
        manager.flags.rally = false;
      }
    })
    .addCase(managerSetFlag, (state, action) => {
      state.managers[action.payload.manager].flags[action.payload.flag] =
        action.payload.value;
    })
    .addCase(managerSetService, (state, action) => {
      state.managers[action.payload.manager].services[action.payload.service] =
        action.payload.value;
    })
    .addCase(managerIncrementBalance, (state, action) => {
      state.managers[action.payload.manager].balance += action.payload.amount;
    })
    .addCase(managerSetBalance, (state, action) => {
      state.managers[action.payload.manager].balance = action.payload.amount;
    })
    .addCase(managerDecrementBalance, (state, action) => {
      state.managers[action.payload.manager].balance -= action.payload.amount;
    })
    .addCase(teamRemoveManager, (state, action) => {
      const mgr = values(state.managers).find(
        (m) => m.team === action.payload.team
      );
      if (mgr) {
        delete mgr.team;
      }
    })
    .addCase(teamAddManager, (state, action) => {
      state.managers[action.payload.manager].team = action.payload.team;
    })
    .addCase(managerIncrementInsuranceExtra, (state, action) => {
      state.managers[action.payload.manager].insuranceExtra +=
        action.payload.amount;
    })
    .addCase(managerSetExtra, (state, action) => {
      state.managers[action.payload.manager].extra = action.payload.extra;
    })
    .addCase(managerSetInsuranceExtra, (state, action) => {
      state.managers[action.payload.manager].insuranceExtra =
        action.payload.value;
    })
    .addCase(managerAdd, (state, action) => {
      state.managers[action.payload.manager.id] = action.payload.manager;
    })
    .addCase(managerRenameArena, (state, action) => {
      state.managers[action.payload.manager].arena.name = action.payload.name;
    })
    .addCase(managerSetArenaLevel, (state, action) => {
      state.managers[action.payload.manager].arena.level = action.payload.level;
    })
    .addCase(managerSetActive, (state, action) => {
      state.active = action.payload;
    })
    .addCase(orderPrank, (state, action) => {
      state.managers[action.payload.manager].pranksExecuted += 1;
    });
});
