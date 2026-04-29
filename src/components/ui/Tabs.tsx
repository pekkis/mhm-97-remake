import { useId, type FC, type ReactNode } from "react";
import * as styles from "./Tabs.css";

export type TabItem = {
  title: string;
  content: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  selected: number;
  onSelect: (index: number) => void;
  className?: string;
};

/**
 * Segmented-control tabs with proper ARIA `tablist`/`tab`/`tabpanel`
 * wiring. Configuration-driven (pass an `items` array) — no children
 * acrobatics, no `cloneElement`, no implicit prop injection.
 */
const Tabs: FC<TabsProps> = ({ items, selected, onSelect, className }) => {
  const baseId = useId();
  const safeSelected = Math.min(Math.max(selected, 0), items.length - 1);
  const current = items[safeSelected];

  return (
    <div className={className}>
      <div className={styles.root}>
        <div role="tablist" className={styles.list}>
          {items.map((item, index) => {
            const isActive = index === safeSelected;
            return (
              <button
                key={item.title}
                type="button"
                role="tab"
                id={`${baseId}-tab-${index}`}
                aria-selected={isActive}
                aria-controls={`${baseId}-panel-${index}`}
                tabIndex={isActive ? 0 : -1}
                className={isActive ? styles.tab.active : styles.tab.inactive}
                onClick={() => onSelect(index)}
              >
                {item.title}
              </button>
            );
          })}
        </div>

        {current && (
          <div
            role="tabpanel"
            id={`${baseId}-panel-${safeSelected}`}
            aria-labelledby={`${baseId}-tab-${safeSelected}`}
            className={styles.panel}
          >
            {current.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;
