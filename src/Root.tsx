import App from "./components/containers/AppContainer";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import typography from "./services/typography";
import { GoogleFont, TypographyStyle } from "react-typography";
import { createGlobalStyle } from "styled-components";

import { ThemeProvider } from "styled-components";
import theme from "./themes/white";

const GlobalStyle = createGlobalStyle`

  html {
    background-color: ${(props) => props.theme.colors.white};
    color: ${(props) => props.theme.colors.black}
  }

  body {
    padding: 0;
  }

  form {
    margin: 0;
    padding: 0;
  }

  p {
    margin: 1em 0;
  }

`;

const Root = (props) => {
  const { store } = props;
  return (
    <>
      <TypographyStyle typography={typography} />
      {/*<GoogleFont typography={typography} />*/}
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <>
              <GlobalStyle />
              <App />
            </>
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    </>
  );
};

export default Root;
