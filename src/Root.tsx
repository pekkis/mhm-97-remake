import App from "./components/App";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "./styles/global.css";
import type { Store } from "redux";
import type { FC } from "react";
import { AppMachineContext } from "@/context/app-machine-context";

type Props = {
  store: Store;
};

const Root: FC<Props> = ({ store }) => {
  return (
    <>
      <AppMachineContext.Provider>
        <ReduxProvider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ReduxProvider>
      </AppMachineContext.Provider>
    </>
  );
};

export default Root;
