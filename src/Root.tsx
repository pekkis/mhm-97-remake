import App from "./components/App";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "./styles/global.css";
import type { Store } from "redux";
import type { FC } from "react";

type Props = {
  store: Store;
};

const Root: FC<Props> = ({ store }) => {
  return (
    <>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </>
  );
};

export default Root;
