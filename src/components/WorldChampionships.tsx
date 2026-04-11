import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";

import Box from "./styled-system/Box";
import { useAppSelector } from "@/config/redux";

/*
IF tuurix(tux) > 15 THEN COLOR 13, 0: PRINT lw(tux); " pelasi koko turnauksen ajan todella suurella syd\"mell\"!": franko = franko + 1
IF tuurix(tux) < -15 THEN COLOR 5, 0: PRINT lw(tux); " k\"rsi koko turnauksen ajan suurista ongelmista!": franko = franko + 1
*/

const WorldChampionships = () => {
  const results = useAppSelector(
    (state) => state.game.worldChampionshipResults
  )!;
  const turn = useAppSelector((state) => state.game.turn);

  return (
    <HeaderedPage>
      <Header forward="Palkintogaala" />

      <Box p={1}>
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
    </HeaderedPage>
  );
};

export default WorldChampionships;
