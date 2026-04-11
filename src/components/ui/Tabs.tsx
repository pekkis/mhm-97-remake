import { Children, cloneElement, type ReactElement } from "react";
import * as styles from "./Tabs.css";

type TabsProps = {
  className?: string;
  children: ReactElement[];
  selected: number;
  onSelect: (index: number) => void;
};

const Tabs = ({ className, children, selected, onSelect }: TabsProps) => {
  const childrenArray = Children.toArray(children) as ReactElement<any>[];

  return (
    <div className={styles.tabs}>
      <ul className={styles.tabsList}>
        {childrenArray.map((child, key) =>
          cloneElement(child, {
            isSelected: key === selected,
            onSelect: () => onSelect(key)
          } as any)
        )}
      </ul>

      <div className={styles.tabContent}>
        {(childrenArray[selected].props as any).children}
      </div>
    </div>
  );
};

export default Tabs;
