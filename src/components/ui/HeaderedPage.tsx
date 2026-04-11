import type { FC, HTMLAttributes } from "react";
import clsx from "clsx";
import { headeredPage } from "./HeaderedPage.css";

const HeaderedPage: FC<HTMLAttributes<HTMLElement>> = ({ className, ...rest }) => {
  return <section className={clsx(headeredPage, className)} {...rest} />;
};

export default HeaderedPage;
