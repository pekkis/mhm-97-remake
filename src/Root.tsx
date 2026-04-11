import App from "./components/App";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import typography from "./services/typography";
import { TypographyStyle } from "react-typography";
import "./styles/global.css";

const Root = (props) => {
  const { store } = props;
  return (
    <>
      <TypographyStyle typography={typography} />
      {/*<GoogleFont typography={typography} />*/}
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </>
  );
};

export default Root;
