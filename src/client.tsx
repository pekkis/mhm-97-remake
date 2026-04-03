import React from "react";
import {createRoot} from "react-dom/client"
import Root from "./Root";

import { getInitialState } from "./config/state";

import createStore from "./store";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faSpinner,
  faBars,
  faExclamationCircle
} from "@fortawesome/free-solid-svg-icons";

import "./style.pcss";

// import * as Sentry from "@sentry/browser";

/*
Sentry.init({
  environment: process.env.NODE_ENV,
  dsn: "https://38630b0d78f645abb5cae7e82bc1582c@sentry.io/1367033"
});
*/

library.add(faSpinner, faBars, faExclamationCircle);

const initialState = getInitialState();

const store = createStore(initialState);

// Just a small DRY abstraction here.
function render(Component: typeof Root, rootElement: HTMLElement) {

  const root = createRoot(rootElement)

  root.render(<Component store={store} />);
}

// If we get !undefined state from the server, we hydrate.
const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Oh noes, no root element be found!");
}

render(Root, rootElement);

