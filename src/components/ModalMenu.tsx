import * as styles from "./ModalMenu.css";
import ActionMenu from "./ActionMenu";
import { useAppDispatch } from "@/config/redux";
import { closeMenu } from "@/ducks/ui";

const ModalMenu = () => {
  const dispatch = useAppDispatch();
  return (
    <div className={styles.menuContainer} onClick={() => dispatch(closeMenu())}>
      <div
        className={styles.menuContents}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <ActionMenu />
      </div>
    </div>
  );
};

export default ModalMenu;
