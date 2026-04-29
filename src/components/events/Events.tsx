import { values } from "remeda";
import Box from "@/components/ui/Box";
import EventResolver from "./EventResolver";
import type { StoredEvent } from "@/state/event";
import Paragraph from "@/components/ui/Paragraph";

type EventsListProps = {
  events: Record<string, StoredEvent>;
  manager: { id: string };
  onAnswer: (event: StoredEvent, key: string) => void;
};

const Events = ({ events, manager, onAnswer }: EventsListProps) => {
  const managersEvents = values(events).filter((e) => e.manager === manager.id);

  return (
    <Box>
      {managersEvents.length === 0 && <Paragraph>Ei tapahtumia.</Paragraph>}

      {managersEvents.map((e) => (
        <EventResolver key={e.id} event={e} onAnswer={onAnswer} />
      ))}
    </Box>
  );
};

export default Events;
