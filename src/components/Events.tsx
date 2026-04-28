import EventsList from "./events/Events";
import ManagerInfo from "./ManagerInfo";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
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
    <HeaderedPage>
      <Header />
      <ManagerInfo details />

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
    </HeaderedPage>
  );
};

export default Events;
