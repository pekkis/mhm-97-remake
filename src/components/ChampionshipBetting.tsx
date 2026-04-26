import ManagerInfo from "./ManagerInfo";
import HeaderedPage from "./ui/HeaderedPage";
import Button from "./form/Button";
import BettingForm from "./championship-betting/BettingForm";
import Box from "./styled-system/Box";
import { GameMachineContext } from "@/context/game-machine-context";
import { activeManager } from "@/machines/selectors";

const ChampionshipBetting = () => {
  const manager = GameMachineContext.useSelector((state) =>
    activeManager(state.context)
  );
  const teams = GameMachineContext.useSelector((state) => state.context.teams);
  const competitions = GameMachineContext.useSelector(
    (state) => state.context.competitions
  );
  const actor = GameMachineContext.useActorRef();

  return (
    <HeaderedPage>
      <ManagerInfo details />

      <Box p={1}>
        <h2>Mestariveikkaus</h2>

        <p>
          On vuosittaisen <strong>mestariveikkauksen aika</strong>. Tässä
          ehdokkaat ja heidän kertoimensa.
        </p>

        <BettingForm
          manager={manager}
          betChampion={(
            managerId: string,
            teamId: number,
            amount: number,
            odds: number
          ) =>
            actor.send({
              type: "PLACE_CHAMPION_BET",
              payload: {
                manager: managerId,
                team: teamId,
                amount,
                odds
              }
            })
          }
          competition={competitions.phl}
          teams={teams}
        />

        <Button secondary block onClick={() => actor.send({ type: "ADVANCE" })}>
          En halua veikata
        </Button>
      </Box>
    </HeaderedPage>
  );
};

export default ChampionshipBetting;
