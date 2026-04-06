import { call } from "typed-redux-saga";
import { produce } from "immer";
import { addEvent, resolvedEvent } from "../../sagas/event";
import type { MHMEvent } from "../../types/base";

const eventId = "grossman";

type GrossmanData = {
  id: string;
  eventId: typeof eventId;
  manager: string;
  resolved: boolean;
};

const event: MHMEvent<GrossmanData> = {
  type: "manager",

  create: function* (data) {
    const { manager } = data;

    yield* call(addEvent, {
      eventId,
      manager,
      resolved: false
    });
  },

  options: () => {
    return {
      agree: `Ei, kiitos!`,
      disagree: `Kiitos, ei!`
    } as any;
  },

  resolve: function* (data) {
    const resolved = produce(data, (draft) => {
      draft.resolved = true;
    });

    yield* call(resolvedEvent, resolved);
  },

  render: (data) => {
    const lines = [
      `Urheilun tappaja, pienten seurojen kirous, kuuluisan Grossman-päätöksen aikaansaaja, __Marc Grossman__, haluaisi pelata joukkueessasi. Otatko kaikkialla vihatun Grossmanin joukkueeseesi?`
    ];

    if (!data.resolved) {
      return lines;
    }

    lines.push(
      `__Grossman__ pillahtaa itkuun. Hänen uransa on tuhottu, vaikka hän tarkoitti vain hyvää.`
    );

    return lines;
  },

  process: function* () {}
};

export default event;
