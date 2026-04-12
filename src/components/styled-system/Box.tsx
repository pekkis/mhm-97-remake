import type { FC, ReactNode } from "react";
import clsx from "clsx";
import { sprinkles } from "@/styles/sprinkles.css";
import { vars } from "@/styles/theme.css";
import { keys } from "remeda";

type SpaceKey = keyof typeof vars.space;
type ColorKey = keyof typeof vars.color;

const spaceKeys = keys(vars.space) as SpaceKey[];

const toSpaceKey = (value: number | SpaceKey): SpaceKey => {
  if (typeof value === "number") {
    return spaceKeys[value];
  }
  return value;
};

type BoxProps = {
  children?: ReactNode;
  className?: string;
  p?: number | SpaceKey;
  px?: number | SpaceKey;
  py?: number | SpaceKey;
  m?: number | SpaceKey;
  mx?: number | SpaceKey;
  my?: number | SpaceKey;
  bg?: ColorKey;
};

const Box: FC<BoxProps> = ({
  children,
  className,
  p,
  px,
  py,
  m,
  mx,
  my,
  bg
}) => {
  const sprinkleClass = sprinkles({
    ...(p !== undefined && { padding: toSpaceKey(p) }),
    ...(px !== undefined && { paddingX: toSpaceKey(px) }),
    ...(py !== undefined && { paddingY: toSpaceKey(py) }),
    ...(m !== undefined && { margin: toSpaceKey(m) }),
    ...(mx !== undefined && { marginX: toSpaceKey(mx) }),
    ...(my !== undefined && { marginY: toSpaceKey(my) }),
    ...(bg !== undefined && { backgroundColor: bg })
  });
  return <div className={clsx(sprinkleClass, className)}>{children}</div>;
};

Box.displayName = "Box";

export default Box;
