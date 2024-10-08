import StartMenu from "./containers/StartMenuContainer";
import Game from "./containers/GameContainer";
import * as Sentry from "@sentry/browser";
import { Component } from "react";
import { Main } from "./Main";

class App extends Component {
  state = {
    hasError: false
  };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    return;
    Sentry.withScope((scope) => {
      Object.keys(info).forEach((key) => {
        scope.setExtra(key, info[key]);
      });
      Sentry.captureException(error);
    });
  }

  render() {
    const { hasError } = this.state;
    const { started } = this.props;

    if (hasError) {
      return (
        <div>
          <h1>Jokin meni pieleen. Voi örr!</h1>

          <p>Syynä lienee tieteelle tuntematon bugi.</p>

          <p>
            Virhe on toivottavasti jo lähetetty palvelimelle turvaan ja Pekkis
            näkee sen! Toivottavasti olit tallentanut, koska tästä ei toivuta!
          </p>
        </div>
      );
    }

    switch (true) {
      case !started:
        return (
          <Main>
            <StartMenu />
          </Main>
        );

      default:
        return (
          <Main>
            <Game />
          </Main>
        );
    }
  }
}

export default App;
