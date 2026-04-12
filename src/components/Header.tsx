import * as styles from "./Header.css";
import Button from "./form/Button";
import { FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { advance } from "@/ducks/game";
import { uiStore } from "@/stores/ui";
import { advanceEnabled as advanceEnabledSelector } from "@/selectors";

type HeaderProps = {
  back?: boolean;
  menu?: boolean;
  forward?: React.ReactNode;
};

const Header = ({
  back = false,
  menu = false,
  forward = "Eteenpäin!"
}: HeaderProps) => {
  const advanceEnabled = useAppSelector(advanceEnabledSelector);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <header className={styles.container}>
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
              <Button
                secondary
                onClick={() => uiStore.send({ type: "toggleMenu" })}
              >
                <FaBars />
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
    </header>
  );
};

export default Header;
