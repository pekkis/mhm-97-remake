import Events from "./events/Events";
import News from "./news/News";
import Situation from "./context-sensitive/Situation";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Button from "./form/Button";

import BettingForm from "./championship-betting/BettingForm";

import Box from "./styled-system/Box";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { advance } from "../ducks/game";
import { requestChampionBet } from "../ducks/betting";

const ChampionshipBetting = () => {
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!],
  );
  const teams = useAppSelector((state) => state.game.teams);
  const competitions = useAppSelector((state) => state.game.competitions);
  const dispatch = useAppDispatch();

  return (
    <HeaderedPage>
      <ManagerInfo />

      <Box p={1}>
        <h2>Mestariveikkaus</h2>

        <p>
          On vuosittaisen <strong>mestariveikkauksen aika</strong>. Tässä
          ehdokkaat ja heidän kertoimensa.
        </p>

        <BettingForm
          manager={manager}
          betChampion={(managerId: string, teamId: number, amount: number, odds: number) =>
            dispatch(requestChampionBet({ manager: managerId, team: teamId, amount, odds }))
          }
          competition={competitions.phl}
          teams={teams}
        />

        <Button secondary block onClick={() => dispatch(advance(undefined))}>
          En halua veikata
        </Button>
      </Box>
    </HeaderedPage>
  );
};

export default ChampionshipBetting;
