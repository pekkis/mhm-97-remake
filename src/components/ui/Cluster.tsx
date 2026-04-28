import type { FC, ReactNode } from "react";
import clsx from "clsx";
import { sprinkles } from "@/styles/sprinkles.css";
import { vars } from "@/styles/theme.css";

type SpaceKey = keyof typeof vars.space;
type Align = "stretch" | "start" | "center" | "end" | "baseline";
type Justify =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around"
  | "space-evenly";

type LayoutElement =
  | "div"
  | "section"
  | "article"
  | "nav"
  | "ul"
  | "ol"
  | "header"
  | "footer"
  | "main"
  | "aside"
  | "form";

type ClusterProps = {
  children?: ReactNode;
  className?: string;
  as?: LayoutElement;
  gap?: SpaceKey;
  align?: Align;
  justify?: Justify;
  reverse?: boolean;
  inline?: boolean;
};

const Cluster: FC<ClusterProps> = ({
  children,
  className,
  as: Element = "div",
  gap = "sm",
  align = "center",
  justify = "start",
  reverse = false,
  inline = false
}) => {
  const sprinkleClass = sprinkles({
    display: inline ? "inline-flex" : "flex",
    flexDirection: reverse ? "row-reverse" : "row",
    flexWrap: "wrap",
    alignItems: align,
    justifyContent: justify,
    gap
  });
  return (
    <Element className={clsx(sprinkleClass, className)}>{children}</Element>
  );
};

Cluster.displayName = "Cluster";

export default Cluster;
