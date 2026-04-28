import type { FC, ReactNode } from "react";
import clsx from "clsx";
import { sprinkles } from "@/styles/sprinkles.css";
import { vars } from "@/styles/theme.css";
import * as styles from "./Paragraph.css";

type FontSizeKey = keyof typeof vars.fontSize;
type FontWeightKey = keyof typeof vars.fontWeight;
type TextAlign = "start" | "center" | "end" | "justify";

type ParagraphProps = {
  children?: ReactNode;
  className?: string;
  size?: FontSizeKey;
  weight?: FontWeightKey;
  align?: TextAlign;
};

/**
 * Plain `<p>` with sprinkle-driven typography props. Inherits the
 * element default `margin: 1em 0` from `src/styles/global.css.ts`.
 */
const Paragraph: FC<ParagraphProps> = ({
  children,
  className,
  size,
  weight,
  align
}) => {
  const sprinkleClass = sprinkles({
    ...(size !== undefined && { fontSize: size }),
    ...(weight !== undefined && { fontWeight: weight }),
    ...(align !== undefined && { textAlign: align })
  });
  return (
    <p className={clsx(styles.root, sprinkleClass, className)}>{children}</p>
  );
};

Paragraph.displayName = "Paragraph";

export default Paragraph;
