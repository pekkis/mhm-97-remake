import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import ManagerInfo from "./ManagerInfo";
import Box from "./ui/Box";
import tournamentList from "@/data/tournaments";
import Markdown from "react-markdown";
import Button from "./form/Button";
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
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

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
    </HeaderedPage>
  );
};

export default Invitations;
