import Events from "./events/Events";
import News from "./news/News";
import Situation from "./context-sensitive/Situation";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Button from "./form/Button";

import BettingForm from "./betting/BettingForm";

import Box from "./styled-system/Box";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { requestBet } from "../ducks/betting";

const Betting = () => {
  const turn = useAppSelector((state) => state.game.turn);
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!]
  );
  const teams = useAppSelector((state) => state.game.teams);
  const competition = useAppSelector((state) => state.game.competitions.phl);
  const dispatch = useAppDispatch();

  return (
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

      <Box p={1}>
        <h2>Kavioveikkaus</h2>

        <p>Puuppa.</p>

        <BettingForm
          turn={turn}
          teams={teams}
          manager={manager}
          bet={(coupon: string[], amount: number) =>
            dispatch(requestBet({ manager: manager.id, coupon, amount }))
          }
          competition={competition}
        />
      </Box>
    </HeaderedPage>
  );
};

export default Betting;
