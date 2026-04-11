import type { FC, HTMLAttributes } from "react";
import clsx from "clsx";
import { buttonContainer } from "./ButtonContainer.css";

const ButtonContainer: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => {
  return <div className={clsx(buttonContainer, className)} {...rest} />;
};

export default ButtonContainer;
