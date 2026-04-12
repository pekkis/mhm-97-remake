import { createRoot } from "react-dom/client";
import Root from "./Root";

import store from "./store";
import { connectInspector } from "./stores/inspector";

connectInspector();

const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Oh noes, no root element be found!");
}

const root = createRoot(rootElement);

root.render(<Root store={store} />);
