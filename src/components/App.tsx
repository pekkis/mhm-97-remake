import StartMenu from "./StartMenu";
import Game from "./Game";
import { useAppSelector } from "@/config/redux";
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
  const started = useAppSelector((state) => state.meta.started);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {started ? <Game /> : <StartMenu />}
    </ErrorBoundary>
  );
};

export default App;
