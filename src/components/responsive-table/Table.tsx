import type { FC, ReactNode, TableHTMLAttributes } from "react";

type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  isClone?: boolean;
  children: ReactNode;
};

const Table: FC<TableProps> = ({ isClone = false, children, ...rest }) => {
  return (
    <table {...rest} className={isClone ? "clone" : undefined}>
      {children}
    </table>
  );
};

export default Table;
