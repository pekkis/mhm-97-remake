import type { FC } from "react";
import { entries } from "remeda";
import Markdown from "@/components/Markdown";
import Button from "@/components/ui/Button";
import Stack from "@/components/ui/Stack";
import newEvents from "@/game/new-events";

// See `src/game/new-events/index.ts` — `as const` registry needs a
// string-keyed widening to look up by runtime event id.
const eventRegistry = newEvents as unknown as Record<
  string,
  (typeof newEvents)[keyof typeof newEvents] | undefined
>;

type EventResolverProps = {
  event: any;
  onAnswer: (event: any, key: string) => void;
};

const EventResolver: FC<EventResolverProps> = ({ event, onAnswer }) => {
  const definition = eventRegistry[event.eventId];

  if (!definition) {
    // The machine refuses to spawn events whose definitions aren't in
    // the registry, so reaching here means the registry and the
    // running game are out of sync — most likely a save from a build
    // that knew about an event id this build doesn't. Loud is better
    // than silently rendering nothing.
    throw new Error(`Unknown event id: ${event.eventId}`);
  }

  return (
    <div>
      <Markdown>
        {definition
          .render(event)
          .filter((t) => t)
          .join("\n\n")}
      </Markdown>
      {!event.resolved && definition.options && (
        <Stack>
          {entries(definition.options(event)).map(([key, option]) => (
            <Button key={key} block onClick={() => onAnswer(event, key)}>
              {option}
            </Button>
          ))}
        </Stack>
      )}
    </div>
  );
};

export default EventResolver;
