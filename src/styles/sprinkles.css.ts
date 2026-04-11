import { defineProperties, createSprinkles } from "@vanilla-extract/sprinkles";
import { vars } from "./theme.css";

const spaceProperties = defineProperties({
  properties: {
    paddingTop: vars.space,
    paddingBottom: vars.space,
    paddingLeft: vars.space,
    paddingRight: vars.space,
    marginTop: vars.space,
    marginBottom: vars.space,
    marginLeft: vars.space,
    marginRight: vars.space,
    gap: vars.space
  },
  shorthands: {
    padding: ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"],
    paddingX: ["paddingLeft", "paddingRight"],
    paddingY: ["paddingTop", "paddingBottom"],
    margin: ["marginTop", "marginBottom", "marginLeft", "marginRight"],
    marginX: ["marginLeft", "marginRight"],
    marginY: ["marginTop", "marginBottom"]
  }
});

const colorProperties = defineProperties({
  properties: {
    color: vars.color,
    backgroundColor: vars.color
  }
});

export const sprinkles = createSprinkles(spaceProperties, colorProperties);

export type Sprinkles = Parameters<typeof sprinkles>[0];
