import App from "./components/App";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "./styles/global.css";

const Root = (props) => {
  const { store } = props;
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
