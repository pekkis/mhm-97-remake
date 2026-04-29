import StickyMenu from "./StickyMenu";
import AdvancedHeaderedPage from "./ui/AdvancedHeaderedPage";

import Box from "./ui/Box";
import { useGameContext } from "@/context/game-machine-context";

/*
IF tuurix(tux) > 15 THEN COLOR 13, 0: PRINT lw(tux); " pelasi koko turnauksen ajan todella suurella syd\"mell\"!": franko = franko + 1
IF tuurix(tux) < -15 THEN COLOR 5, 0: PRINT lw(tux); " k\"rsi koko turnauksen ajan suurista ongelmista!": franko = franko + 1
*/

const WorldChampionships = () => {
  const results = useGameContext((ctx) => ctx.worldChampionshipResults)!;
  const turn = useGameContext((ctx) => ctx.turn);

  return (
    <AdvancedHeaderedPage stickyMenu={<StickyMenu forward="Palkintogaala" />}>
      <Box p="md">
        <h2>Maailmanmestaruuskisat {turn.season + 1}</h2>

        <div>
          {results
            .filter((e) => e.luck > 0)
            .map((e) => {
              return (
                <p key={e.id}>
                  <strong>{e.name}</strong> pelasi koko turnauksen ajan todella
                  suurella sydämellä!
                </p>
              );
            })}
          {results
            .filter((e) => e.luck < 0)
            .map((e) => {
              return (
                <p key={e.id}>
                  <strong>{e.name}</strong> kärsi koko turnauksen ajan suurista
                  ongelmista!
                </p>
              );
            })}
        </div>

        <ol>
          {results.map((entry) => {
            return <li key={entry.id}>{entry.name}</li>;
          })}
        </ol>
      </Box>
    </AdvancedHeaderedPage>
  );
};

export default WorldChampionships;
