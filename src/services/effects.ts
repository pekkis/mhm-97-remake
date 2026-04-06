import type { Map, List } from "immutable";
import namedEffects from "../data/named-effects";

type ImmutableEffect = Map<string, unknown>;
type ImmutableObj = Map<string, unknown>;

const affect = (
  target: ImmutableObj,
  source: ImmutableObj,
  field: string
): ImmutableObj => {
  const effects = source.get(field) as List<ImmutableEffect>;
  return effects.reduce((obj: ImmutableObj, effect: ImmutableEffect) => {
    const parameter = effect.get("parameter") as string[];
    const amount = effect.get("amount");

    if (typeof amount === "string") {
      const namedEffect = namedEffects[amount];
      if (!namedEffect) {
        throw new Error(`Unknown named effect "${amount}"`);
      }
      return obj.updateIn(parameter, (p) => {
        return namedEffect(
          p as number,
          effect.get("extra") as Map<string, unknown>
        );
      });
    }

    return obj.updateIn(parameter, (p) => {
      return (p as number) + (amount as number);
    });
  }, target);
};

export const getEffective = (obj: ImmutableObj): ImmutableObj => {
  return affect(obj, obj, "effects");
};

export const getEffectiveOpponent = (
  obj: ImmutableObj,
  opponent: ImmutableObj
): ImmutableObj => {
  return affect(obj, opponent, "opponentEffects");
};
