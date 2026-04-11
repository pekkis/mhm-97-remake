import type { FC } from "react";
import clsx from "clsx";
import * as styles from "./Tab.css";

type TabProps = {
  title: string;
  className?: string;
  onSelect?: () => void;
  isSelected?: boolean;
  children?: React.ReactNode;
};

const Tab: FC<TabProps> = ({ title, className, onSelect, isSelected }) => {
  return (
    <li
      className={clsx(styles.tab, isSelected && styles.selected, className)}
      onClick={() => {
        onSelect?.();
      }}
    >
      {title}
    </li>
  );
};

export { styles as tabStyles };
export default Tab;
