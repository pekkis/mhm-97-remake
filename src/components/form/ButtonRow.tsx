import type { FC, HTMLAttributes } from "react";
import clsx from "clsx";
import { buttonRow } from "./ButtonRow.css";

const ButtonRow: FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => {
  return <div className={clsx(buttonRow, className)} {...rest} />;
};

export default ButtonRow;
