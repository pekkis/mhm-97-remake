import type { FC, ReactNode } from "react";
import Centerer from "@/components/Centerer";
import * as styles from "./AdvancedHeaderedPage.css";

type Props = {
  stickyMenu?: ReactNode;
  children: ReactNode;
  managerInfo?: ReactNode;
};

const AdvancedHeaderedPage: FC<Props> = ({
  stickyMenu,
  children,
  managerInfo
}) => {
  return (
    <div className={styles.root}>
      {managerInfo}
      <div className={styles.content}>
        <Centerer>{children}</Centerer>
      </div>
      {stickyMenu && <div className={styles.stickyMenu}>{stickyMenu}</div>}
    </div>
  );
};

export default AdvancedHeaderedPage;
