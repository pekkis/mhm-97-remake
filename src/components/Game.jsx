import React from "react";
import { Routes, Route } from "react-router-dom";
import styled from "styled-components";

import MainMenu from "./containers/MainMenuContainer";
import TransferMarket from "./containers/TransferMarketContainer";
import LeagueTables from "./containers/LeagueTablesContainer";
import DeveloperMenu from "./containers/DeveloperMenuContainer";
import SelectStrategy from "./containers/SelectStrategyContainer";
import Events from "./containers/EventsContainer";
import News from "./containers/NewsContainer";
import Gameday from "./containers/GamedayContainer";
import GamedayResults from "./containers/GamedayResultsContainer";
import CrisisActions from "./containers/CrisisActionsContainer";
import Arena from "./containers/ArenaContainer";
import Services from "./containers/ServicesContainer";
import Pranks from "./containers/PranksContainer";
import Notifications from "./notifications/containers/NotificationsContainer";
import ModalMenu from "./containers/ModalMenuContainer";
import ChampionshipBetting from "./containers/ChampionshipBettingContainer";
import Betting from "./containers/BettingContainer";
import EndOfSeason from "./containers/EndOfSeasonContainer";
import WorldChampionships from "./containers/WorldChampionshipsContainer";
import Stats from "./containers/StatsContainer";
import Invitations from "./containers/InvitationsContainer";
import Gala from "./containers/GalaContainer";

const Phase = props => {
  const { turn } = props;

  switch (true) {
    case turn.get("phase") === "select-strategy":
      return <SelectStrategy />;

    case turn.get("phase") === "championship-betting":
      return <ChampionshipBetting />;

    case turn.get("phase") === "event":
      return <Events />;

    case turn.get("phase") === "gala":
      return <Gala />;

    case turn.get("phase") === "news":
      return <News />;

    case turn.get("phase") === "gameday":
      return <Gameday />;

    case turn.get("phase") === "world-championships":
      return <WorldChampionships />;

    case turn.get("phase") === "end-of-season":
      return <EndOfSeason />;

    case turn.get("phase") === "results":
      return <GamedayResults />;

    case turn.get("phase") === "action":
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
      console.log("turn", turn.toJS());
      return "laddare...";
  }
};

const Game = props => {
  const { className, menu } = props;
  return (
    <div className={className}>
      {menu && <ModalMenu />}
      <Phase {...props} />
      <Notifications />
    </div>
  );
};

export default styled(Game)``;
