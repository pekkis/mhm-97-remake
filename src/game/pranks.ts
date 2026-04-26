import { call } from "typed-redux-saga";
import { addEffect } from "@/sagas/team";
import events from "@/game/events";

export type PrankInstance = {
  manager: string;
  victim: number;
  type: string;
};

type Prank = {
  name: string;
  price: (competition: string) => number;
  orderMessage: (prank: PrankInstance) => string;
  execute: (prank: PrankInstance) => Generator;
};

const pranks: Record<string, Prank> = {
  protest: {
    name: "Protesti",
    price: () => 0,

    orderMessage: () =>
      `Faksaat protestin jääkiekkoliiton toimistolle. Pian hakulaitteesi jo piippaakin iloisesti: kirjelmä on vastaanotettu, ja se luvataan käsitellä "pikaisesti"`,

    execute: function* (prank) {
      const protestEvent = events["protest"];
      yield* call(protestEvent.create, prank);
    }
  },
  playerHooking: {
    name: "Huumausaineiden myynti pelaajille",
    price: () => 150000,

    orderMessage: () =>
      `Pikainen soitto Pösilän miehelle, vanhalle ystävällesi ja Helsingin huumemiliisin päällikölle __Ari Jaarniolle__, ja homma hoituu! Jaarnio lupaa lähettää miehensä matkaan alta aikayksikön!`,

    execute: function* (prank) {
      const event = events["sellNarcotics"];
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

    orderMessage: () =>
      `Soitat hämäräperäiselle vedonvälittäjälle, ja kerrot mitä tahdot. Hän lupaa hoitaa "asian" hienovaraisesti.`,

    execute: function* (prank) {
      yield addEffect(prank.victim, ["strength"], -10000, 1);
    }
  },
  bazookaStrike: {
    name: "Sinkoisku joukkueen matkabussiin",
    price: () => 3000000,

    orderMessage: () =>
      `Fanikauppanne vieressä onkin sopivasti moottoripyöräjengi MC Habadobon kerhotila. Ne pojat ovat tottuneet astetta rankempiin välienselvittyihin. Käyt toimittamassa tyypeille salkullisen kylmää käteistä, ja saat lupauksen pikaisesta toimituksesta.`,

    execute: function* (prank) {
      const event = events["bazookaStrike"];
      yield* call(event.create, prank);
    }
  }
};

export default pranks;
