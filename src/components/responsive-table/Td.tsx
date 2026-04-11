import type { FC, TdHTMLAttributes } from "react";
import clsx from "clsx";
import * as styles from "./Td.css";

const Td: FC<TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...rest
}) => {
  return <td className={clsx(styles.td, className)} {...rest} />;
};

export default Td;
