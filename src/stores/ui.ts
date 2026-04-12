import { createStore } from "@xstate/store";

export type UiStoreContext = {
  menu: boolean;
};

export const uiStore = createStore({
  context: {
    menu: false as boolean
  },
  on: {
    toggleMenu: (context) => ({
      ...context,
      menu: !context.menu
    }),
    closeMenu: (context) => ({
      ...context,
      menu: false
    }),
    reset: () => ({
      menu: false
    })
  }
});
