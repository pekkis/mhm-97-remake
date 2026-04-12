import StartMenu from "./StartMenu";
import Game from "./Game";
import { useSelector } from "@xstate/react";
import { appActor } from "@/machines/app";
import { ErrorBoundary } from "react-error-boundary";

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

const App = () => {
  const started = useSelector(appActor, (state) => state.matches("inGame"));

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {started ? <Game /> : <StartMenu />}
    </ErrorBoundary>
  );
};

export default App;
