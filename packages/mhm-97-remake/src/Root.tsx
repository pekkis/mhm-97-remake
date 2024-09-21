import App from "./components/containers/AppContainer";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import typography from "./services/typography";
import { GoogleFont, TypographyStyle } from "react-typography";
import { createGlobalStyle } from "styled-components";

import { ThemeProvider } from "styled-components";
import theme from "./themes/white";

const Root = (props) => {
  const { store } = props;
  return (
    <>
      {/*<GoogleFont typography={typography} />*/}
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <>
              <App />
            </>
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    </>
  );
};

export default Root;
