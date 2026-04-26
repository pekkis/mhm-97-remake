import App from "./components/App";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "./styles/global.css";
import type { Store } from "redux";
import type { FC } from "react";
import { GameMachineContext } from "@/context/game-machine-context";

type Props = {
  store: Store;
};

const Root: FC<Props> = ({ store }) => {
  return (
    <>
      <GameMachineContext.Provider>
        <ReduxProvider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ReduxProvider>
      </GameMachineContext.Provider>
    </>
  );
};

export default Root;
