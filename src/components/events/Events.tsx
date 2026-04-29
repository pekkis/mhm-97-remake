import { values } from "remeda";
import Box from "@/components/ui/Box";
import EventResolver from "./EventResolver";

type EventsListProps = {
  events: Record<string, any>;
  manager: { id: string };
  onAnswer: (event: any, key: string) => void;
};

const Events = ({ events, manager, onAnswer }: EventsListProps) => {
  const managersEvents = values(events).filter((e) => e.manager === manager.id);

  return (
    <Box>
      {managersEvents.map((e) => (
        <EventResolver key={e.id} event={e} onAnswer={onAnswer} />
      ))}
    </Box>
  );
};

export default Events;
