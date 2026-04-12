import { Routes, Route } from "react-router-dom";

import MainMenu from "./MainMenu";
import TransferMarket from "./TransferMarket";
import LeagueTables from "./LeagueTables";
import DeveloperMenu from "./DeveloperMenu";
import SelectStrategy from "./SelectStrategy";
import Events from "./Events";
import News from "./News";
import Gameday from "./Gameday";
import GamedayResults from "./GamedayResults";
import CrisisActions from "./CrisisActions";
import Arena from "./Arena";
import Services from "./Services";
import Pranks from "./Pranks";
import Notifications from "./notifications/Notifications";
import ModalMenu from "./ModalMenu";
import ChampionshipBetting from "./ChampionshipBetting";
import Betting from "./Betting";
import EndOfSeason from "./EndOfSeason";
import WorldChampionships from "./WorldChampionships";
import Stats from "./Stats";
import Invitations from "./Invitations";
import Gala from "./Gala";
import { useAppSelector } from "@/config/redux";
import { useSelector } from "@xstate/store-react";
import { uiStore } from "@/stores/ui";

const Phase = ({ turn }: { turn: { phase: string | undefined } }) => {
  switch (true) {
    case turn.phase === "select-strategy":
      return <SelectStrategy />;

    case turn.phase === "championship-betting":
      return <ChampionshipBetting />;

    case turn.phase === "event":
      return <Events />;

    case turn.phase === "gala":
      return <Gala />;

    case turn.phase === "news":
      return <News />;

    case turn.phase === "gameday":
      return <Gameday />;

    case turn.phase === "world-championships":
      return <WorldChampionships />;

    case turn.phase === "end-of-season":
      return <EndOfSeason />;

    case turn.phase === "results":
      return <GamedayResults />;

    case turn.phase === "action":
      return (
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/sarjataulukot" element={<LeagueTables />} />
          <Route path="/pelaajamarkkinat" element={<TransferMarket />} />
          <Route path="/kriisipalaveri" element={<CrisisActions />} />
          <Route path="/erikoistoimenpiteet" element={<Services />} />
          <Route path="/areena" element={<Arena />} />
          <Route path="/jaynat" element={<Pranks />} />
          <Route path="/tilastot" element={<Stats />} />
          <Route path="/kutsut" element={<Invitations />} />
          <Route path="/veikkaus" element={<Betting />} />
          <Route path="/debug" element={<DeveloperMenu />} />
        </Routes>
      );

    default:
      return "laddare...";
  }
};

const Game = () => {
  const turn = useAppSelector((state) => state.game.turn);
  const menu = useSelector(uiStore, (s) => s.context.menu);
  return (
    <div>
      {menu && <ModalMenu />}
      <Phase turn={turn} />
      <Notifications />
    </div>
  );
};

export default Game;
