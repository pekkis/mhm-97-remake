import { createRoot } from "react-dom/client";
import Root from "./Root";

import { getInitialState } from "./config/state";

import createStore from "./store";

// import runtime from "@dr-kobros/serviceworker-webpack-plugin/lib/runtime";

import "./globals.css";
import "rc-slider/assets/index.css";
import "react-toggle/style.css";

import * as Sentry from "@sentry/browser";

Sentry.init({
  environment: import.meta.env.MODE,
  dsn: "https://38630b0d78f645abb5cae7e82bc1582c@sentry.io/1367033"
});

const initialState = getInitialState();

const store = createStore(initialState);

const rootElement = document.body;
if (!rootElement) {
  throw new Error("Oh noes, no root element be found!");
}

const root = createRoot(rootElement);
root.render(<Root store={store} />);
