import { cloneElement, type ReactElement } from "react";
import * as styles from "./ResponsiveTable.css";

type ResponsiveTableProps = {
  children: ReactElement<{ isClone?: boolean }>;
};

const ResponsiveTable = ({ children }: ResponsiveTableProps) => {
  const clone = cloneElement(children, { isClone: true } as any);

  return (
    <div className={styles.tableScroller}>
      <div className={styles.tableWrapper}>{children}</div>
      {clone}
    </div>
  );
};

export default ResponsiveTable;
