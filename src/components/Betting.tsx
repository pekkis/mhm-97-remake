import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import BettingForm from "./betting/BettingForm";
import Box from "./ui/Box";
import {
  GameMachineContext,
  useGameContext
} from "@/context/game-machine-context";
import { activeManager } from "@/machines/selectors";

const Betting = () => {
  const turn = useGameContext((ctx) => ctx.turn);
  const manager = useGameContext(activeManager);
  const teams = useGameContext((ctx) => ctx.teams);
  const competition = useGameContext((ctx) => ctx.competitions.phl);
  const actor = GameMachineContext.useActorRef();

  return (
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

      <Box p="md">
        <h2>Kavioveikkaus</h2>

        <p>Puuppa.</p>

        <BettingForm
          turn={turn}
          teams={teams}
          manager={manager}
          bet={(coupon: string[], amount: number) =>
            actor.send({
              type: "PLACE_BET",
              payload: { manager: manager.id, coupon, amount }
            })
          }
          competition={competition}
        />
      </Box>
    </HeaderedPage>
  );
};

export default Betting;
