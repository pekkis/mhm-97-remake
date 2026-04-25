import StartMenu from "./StartMenu";
import Game from "./Game";
import { ErrorBoundary } from "react-error-boundary";
import { AppMachineContext } from "@/context/app-machine-context";
import type { FC } from "react";

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

const App: FC = () => {
  const started = AppMachineContext.useSelector((state) => {
    return state.matches("in_game");
  });

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {started ? <Game /> : <StartMenu />}
    </ErrorBoundary>
  );
};

export default App;
