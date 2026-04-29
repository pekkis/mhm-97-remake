import ManagerInfo from "./ManagerInfo";
import StickyMenu from "./StickyMenu";
import AdvancedHeaderedPage from "./ui/AdvancedHeaderedPage";
import BettingForm from "./betting/BettingForm";
import Box from "./ui/Box";
import Paragraph from "./ui/Paragraph";
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
    <AdvancedHeaderedPage
      stickyMenu={<StickyMenu back />}
      managerInfo={<ManagerInfo details />}
    >
      <Box p="md">
        <h2>Kavioveikkaus</h2>

        <Paragraph>Puuppa.</Paragraph>

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
    </AdvancedHeaderedPage>
  );
};

export default Betting;
