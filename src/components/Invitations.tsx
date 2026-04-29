import StickyMenu from "./StickyMenu";
import AdvancedHeaderedPage from "./ui/AdvancedHeaderedPage";
import ManagerInfo from "./ManagerInfo";
import Box from "./ui/Box";
import tournamentList from "@/data/tournaments";
import Markdown from "react-markdown";
import Button from "./ui/Button";
import {
  GameMachineContext,
  useGameContext
} from "@/context/game-machine-context";
import { activeManager, activeManagersInvitations } from "@/machines/selectors";

const Invitations = () => {
  const manager = useGameContext(activeManager);

  const invitations = useGameContext(activeManagersInvitations);
  const actor = GameMachineContext.useActorRef();

  return (
    <AdvancedHeaderedPage
      stickyMenu={<StickyMenu back />}
      managerInfo={<ManagerInfo details />}
    >
      <Box p="md">
        <h2>Turnauskutsut</h2>

        {invitations.map((i, index) => {
          const t = tournamentList[i.tournament];
          return (
            <div key={index}>
              <h3>{t.name}</h3>

              <Markdown>{t.description(t.award)}</Markdown>

              <Button
                block
                onClick={() =>
                  actor.send({
                    type: "ACCEPT_INVITATION",
                    payload: { manager: manager.id, id: i.id }
                  })
                }
                disabled={i.accepted}
              >
                Hyväksy turnauskutsu
              </Button>
            </div>
          );
        })}
      </Box>
    </AdvancedHeaderedPage>
  );
};

export default Invitations;
