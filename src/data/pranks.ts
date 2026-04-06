import { call } from "typed-redux-saga";
import { addNotification } from "../sagas/notification";
import { addEffect } from "../sagas/team";
import events from "../data/events";

export type PrankInstance = {
  manager: string;
  victim: string;
  type: string;
};

type Prank = {
  name: string;
  price: (competition: string) => number;
  order: (prank: PrankInstance) => Generator;
  execute: (prank: PrankInstance) => Generator;
};

const pranks: Record<string, Prank> = {
  protest: {
    name: "Protesti",
    price: () => 0,

    order: function* (prank) {
      yield* call(
        addNotification,
        prank.manager,
        `Faksaat protestin jääkiekkoliiton toimistolle. Pian hakulaitteesi jo piippaakin iloisesti: kirjelmä on vastaanotettu, ja se luvataan käsitellä "pikaisesti"`
      );
    },

    execute: function* (prank) {
      const protestEvent = events.get("protest");
      yield* call(protestEvent.create, prank);
    }
  },
  playerHooking: {
    name: "Huumausaineiden myynti pelaajille",
    price: () => 150000,

    order: function* (prank) {
      yield* call(
        addNotification,
        prank.manager,
        `Pikainen soitto Pösilän miehelle, vanhalle ystävällesi ja Helsingin huumemiliisin päällikölle __Ari Jaarniolle__, ja homma hoituu! Jaarnio lupaa lähettää miehensä matkaan alta aikayksikön!`
      );
    },

    execute: function* (prank) {
      const event = events.get("sellNarcotics");
      yield* call(event.create, prank);
    }
  },
  fixedMatch: {
    name: "Vastustajan lahjonta",
    price: (competition) => {
      if (competition === "phl") {
        return 300000;
      }
      return 150000;
    },

    order: function* (prank) {
      yield* call(
        addNotification,
        prank.manager,
        `Soitat hämäräperäiselle vedonvälittäjälle, ja kerrot mitä tahdot. Hän lupaa hoitaa "asian" hienovaraisesti.`
      );
    },

    execute: function* (prank) {
      yield addEffect(prank.victim, ["strength"], -10000, 1);
    }
  },
  bazookaStrike: {
    name: "Sinkoisku joukkueen matkabussiin",
    price: () => 3000000,

    order: function* (prank) {
      yield* call(
        addNotification,
        prank.manager,
        `Fanikauppanne vieressä onkin sopivasti moottoripyöräjengi MC Habadobon kerhotila. Ne pojat ovat tottuneet astetta rankempiin välienselvittyihin. Käyt toimittamassa tyypeille salkullisen kylmää käteistä, ja saat lupauksen pikaisesta toimituksesta.`
      );
    },

    execute: function* (prank) {
      const event = events.get("bazookaStrike");
      yield* call(event.create, prank);
    }
  }
};

export default pranks;
