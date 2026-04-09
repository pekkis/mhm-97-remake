import styled from "styled-components";
import Button from "./form/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { advance } from "../ducks/game";
import { toggleMenu } from "../ducks/ui";

const Container = styled.header`
  background-color: rgb(133, 133, 133);
  padding: 0.5em 0;
  color: rgb(255, 255, 255);
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  display: flex;
  flex-basis: 100%;
  z-index: 1000;

  .secondary {
    flex-shrink: 10;
    padding: 0 0.5em;
  }

  .advance {
    align-self: flex-end;
    text-align: right;
    flex-grow: 3;
    padding: 0 0.5em;
  }
`;

type HeaderProps = {
  back?: boolean;
  menu?: boolean;
  forward?: React.ReactNode;
};

const Header = ({
  back = false,
  menu = false,
  forward = "Eteenpäin!",
}: HeaderProps) => {
  const advanceEnabled = useAppSelector((state) => state.ui.advanceEnabled);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <Container>
      {back && (
        <div className="advance">
          <Button
            block
            onClick={() => {
              navigate("/");
            }}
          >
            Päävalikkoon
          </Button>
        </div>
      )}

      {!back && (
        <>
          {menu && (
            <div className="secondary">
              <Button secondary onClick={() => dispatch(toggleMenu())}>
                <FontAwesomeIcon icon="bars" />
              </Button>
            </div>
          )}
          <div className="advance">
            <Button
              terse
              block
              disabled={!advanceEnabled}
              onClick={() => dispatch(advance(undefined))}
            >
              {forward}
            </Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default Header;
