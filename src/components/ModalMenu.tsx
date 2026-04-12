import * as styles from "./ModalMenu.css";
import ActionMenu from "./ActionMenu";
import { uiStore } from "@/stores/ui";

const ModalMenu = () => {
  return (
    <div className={styles.menuContainer} onClick={() => uiStore.send({ type: "closeMenu" })}>
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
