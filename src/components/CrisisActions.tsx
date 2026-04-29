import Button from "./ui/Button";
import StickyMenu from "./StickyMenu";
import AdvancedHeaderedPage from "./ui/AdvancedHeaderedPage";
import ManagerInfo from "./ManagerInfo";
import Calendar from "./ui/Calendar";
import Box from "./ui/Box";
import {
  GameMachineContext,
  useGameContext
} from "@/context/game-machine-context";

import crisis from "@/data/crisis";
import { currency as c } from "@/services/format";
import { getEffective } from "@/services/effects";
import { activeManager, canCrisisMeeting } from "@/machines/selectors";

const CrisisActions = () => {
  const manager = useGameContext(activeManager);
  const teams = useGameContext((ctx) => ctx.teams);
  const competitions = useGameContext((ctx) => ctx.competitions);
  const canDo = useGameContext(canCrisisMeeting(manager.id));
  const gameActor = GameMachineContext.useActorRef();

  const team = getEffective(teams[manager.team!]);
  const crisisInfo = crisis(team, competitions);

  return (
    <AdvancedHeaderedPage
      stickyMenu={<StickyMenu back />}
      managerInfo={<ManagerInfo details />}
    >
      <Box p="md">
        <h2>Kriisipalaveri</h2>

        <Calendar
          when={(c) => c.crisisMeeting}
          fallback={
            <p>
              Tässä vaiheessa kautta on auttamatta liian myöhäistä
              kriisipalaveroida!
            </p>
          }
        >
          <p>
            Kriisipalaveri auttaa joukkuetta unohtamaan tappioputken ja
            keskittymään tulevaan. Se maksaa {c(crisisInfo.amount)}.
          </p>

          <Button
            block
            disabled={!canDo}
            onClick={() =>
              gameActor.send({
                type: "CRISIS_MEETING",
                payload: { manager: manager.id }
              })
            }
          >
            Pidä kriisipalaveri
          </Button>
        </Calendar>
      </Box>
    </AdvancedHeaderedPage>
  );
};

export default CrisisActions;
