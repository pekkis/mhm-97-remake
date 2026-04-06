import type { Map } from "immutable";

type NamedEffectFn = (current: number, extra: Map<string, unknown>) => number;

const namedEffects: Record<string, NamedEffectFn> = {
  rally: (_morale, extra) => extra.get("rallyMorale") as number
};

export default namedEffects;
