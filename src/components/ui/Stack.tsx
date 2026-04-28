import type { FC, ReactNode } from "react";
import clsx from "clsx";
import { sprinkles } from "@/styles/sprinkles.css";
import { vars } from "@/styles/theme.css";

type SpaceKey = keyof typeof vars.space;
type Direction = "row" | "row-reverse" | "column" | "column-reverse";
type Align = "stretch" | "start" | "center" | "end" | "baseline";
type Justify =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around"
  | "space-evenly";
type Wrap = "nowrap" | "wrap" | "wrap-reverse";

type StackProps = {
  children?: ReactNode;
  className?: string;
  direction?: Direction;
  gap?: SpaceKey;
  align?: Align;
  justify?: Justify;
  wrap?: Wrap;
  inline?: boolean;
};

const Stack: FC<StackProps> = ({
  children,
  className,
  direction = "column",
  gap = "md",
  align,
  justify,
  wrap,
  inline = false
}) => {
  const sprinkleClass = sprinkles({
    display: inline ? "inline-flex" : "flex",
    flexDirection: direction,
    gap,
    ...(align !== undefined && { alignItems: align }),
    ...(justify !== undefined && { justifyContent: justify }),
    ...(wrap !== undefined && { flexWrap: wrap })
  });
  return <div className={clsx(sprinkleClass, className)}>{children}</div>;
};

Stack.displayName = "Stack";

export default Stack;
