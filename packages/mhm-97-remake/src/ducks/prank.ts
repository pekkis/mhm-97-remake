import { Map, List } from "immutable";
import { loadGameState, quitToMainMenu } from "./meta";

const defaultState = Map({
  pranks: List()
});

export const cancelPrank = (id) => {
  return {
    type: "PRANK_CANCEL",
    payload: id
  };
};

export const selectPrankType = (id) => {
  return {
    type: "PRANK_SELECT_TYPE",
    payload: id
  };
};

export const selectPrankVictim = (id) => {
  return {
    type: "PRANK_SELECT_VICTIM",
    payload: id
  };
};

export const orderPrank = (manager, type, victim) => {
  return {
    type: "PRANK_ORDER",
    payload: {
      manager,
      type,
      victim
    }
  };
};

export default function prankReducer(state = defaultState, action) {
  const { type, payload } = action;

  switch (type) {
    case quitToMainMenu.type:
      return defaultState;

    case loadGameState.type:
      return payload.prank;

    case "PRANK_ADD":
      return state.update("pranks", (pranks) => pranks.push(payload));

    case "PRANK_DISMISS":
      return state.deleteIn(["pranks", payload]);

    default:
      return state;
  }
}
