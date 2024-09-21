import { createRoot } from "react-dom/client";
import Root from "./Root";

import { getInitialState } from "./config/state";

import createStore from "./store";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faSpinner,
  faBars,
  faExclamationCircle
} from "@fortawesome/free-solid-svg-icons";

// import runtime from "@dr-kobros/serviceworker-webpack-plugin/lib/runtime";

import "./globals.css";
import "./style.css";

import * as Sentry from "@sentry/browser";

Sentry.init({
  environment: import.meta.env.MODE,
  dsn: "https://38630b0d78f645abb5cae7e82bc1582c@sentry.io/1367033"
});

library.add(faSpinner, faBars, faExclamationCircle);

const initialState = getInitialState();

const store = createStore(initialState);

const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Oh noes, no root element be found!");
}

const root = createRoot(rootElement);
root.render(<Root store={store} />);
