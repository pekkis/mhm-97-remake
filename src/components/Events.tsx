import EventsList from "./events/Events";
import ManagerInfo from "./ManagerInfo";
import StickyMenu from "./StickyMenu";
import AdvancedHeaderedPage from "./ui/AdvancedHeaderedPage";
import Box from "./ui/Box";
import {
  GameMachineContext,
  useGameContext
} from "@/context/game-machine-context";
import { activeManager } from "@/machines/selectors";

const Events = () => {
  const game = GameMachineContext.useActorRef();
  const manager = useGameContext(activeManager);
  const events = useGameContext((ctx) => ctx.event.events);

  return (
    <AdvancedHeaderedPage
      stickyMenu={<StickyMenu />}
      managerInfo={<ManagerInfo details />}
    >
      <Box p="md">
        <h2>Tapahtumat</h2>
        <EventsList
          manager={manager}
          events={events}
          onAnswer={(e, key) =>
            game.send({
              type: "RESOLVE_EVENT",
              payload: { id: e.id, value: key }
            })
          }
        />
      </Box>
    </AdvancedHeaderedPage>
  );
};

export default Events;
