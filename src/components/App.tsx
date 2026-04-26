import StartMenu from "./StartMenu";
import Game from "./Game";
import { ErrorBoundary } from "react-error-boundary";
import type { FC } from "react";
import { AppMachineContext } from "@/context/app-machine-context";
import { GameMachineContext } from "@/context/game-machine-context";

const ErrorFallback = () => (
  <div>
    <h1>Jokin meni pieleen. Voi örr!</h1>
    <p>Syynä lienee tieteelle tuntematon bugi.</p>
    <p>
      Virhe on toivottavasti jo lähetetty palvelimelle turvaan ja Pekkis näkee
      sen! Toivottavasti olit tallentanut, koska tästä ei toivuta!
    </p>
  </div>
);

const GameProvider: FC = () => {
  // todo: get the game actor here!

  return (
    <GameMachineContext.Provider>
      <Game />
    </GameMachineContext.Provider>
  );
};

const App: FC = () => {
  const playing = AppMachineContext.useSelector((state) => {
    return state.matches("playing");
  });

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {playing ? <GameProvider /> : <StartMenu />}
    </ErrorBoundary>
  );
};

export default App;
