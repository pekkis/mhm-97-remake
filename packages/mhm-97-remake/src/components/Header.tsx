import styled from "styled-components";
import Button from "./form/Button";

import { FaHamburger, FaBars } from "react-icons/fa";

import * as stylex from "@stylexjs/stylex";
import { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const styles = stylex.create({
  container: {
    backgroundColor: "rgb(133, 133, 133)",
    paddingTop: "0.5em",
    paddingBottom: "0.5em",
    paddingLeft: "0",
    paddingRight: "0",
    color: "rgb(255, 255, 255)",

    position: "fixed",
    bottom: 0,
    right: 0,
    left: 0,
    display: "flex",
    flexBasis: "100%",
    zIndex: 1000
  },
  secondary: {
    flexShrink: 10,
    paddingTop: "0",
    paddingBottom: "0",
    paddingLeft: "0.5em",
    paddingRight: "0.5em"
  },
  advance: {
    alignSelf: "flex-end",
    textAlign: "right",
    flexGrow: 3,
    paddingTop: "0",
    paddingBottom: "0",
    paddingLeft: "0.5em",
    paddingRight: "0.5em"
  }
});

type Props = {
  forward?: string;
  back?: boolean;
  menu?: boolean;
};

const Header: FC<Props> = (props) => {
  const navigate = useNavigate();

  const {
    back = false,
    menu = false,
    advanceEnabled,
    advance,
    toggleMenu,
    forward = "Eteenpäin!"
  } = props;

  return (
    <header {...stylex.props(styles.container)}>
      {back && (
        <div className="advance">
          <Button block onClick={() => navigate("/")}>
            Päävalikkoon
          </Button>
        </div>
      )}

      {!back && (
        <>
          {menu && (
            <div {...stylex.props(styles.secondary)}>
              <Button secondary onClick={() => toggleMenu()}>
                <FaBars />
              </Button>

              <Button
                onClick={() => {
                  const mode =
                    localStorage.getItem("theme") === "dark" ? "light" : "dark";

                  localStorage.setItem("theme", mode);
                  document.documentElement.dataset.theme = mode;
                }}
              >
                Mode
              </Button>
            </div>
          )}
          <div {...stylex.props(styles.advance)}>
            <Button
              terse
              block
              disabled={!advanceEnabled}
              onClick={() => advance()}
            >
              {forward}
            </Button>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
