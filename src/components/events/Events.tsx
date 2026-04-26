import Markdown from "react-markdown";
import newEvents from "@/game/new-events";
import { entries, values } from "remeda";

type EventsListProps = {
  events: Record<string, any>;
  manager: { id: string };
  onAnswer: (event: any, key: string) => void;
};

// Same `as const` registry → string-keyed widening shenanigans as in
// the machine. See `src/game/new-events/index.ts` for the whole story.
const eventRegistry = newEvents as unknown as Record<
  string,
  (typeof newEvents)[keyof typeof newEvents] | undefined
>;

const Events = ({ events, manager, onAnswer }: EventsListProps) => {
  const managersEvents = values(events).filter((e) => e.manager === manager.id);

  return (
    <div>
      <p>{managersEvents.length} tapahtumaa...</p>

      {managersEvents.map((e) => {
        const event = eventRegistry[e.eventId];
        if (!event) {
          // Event spawned but not yet ported to new-events/.
          // Should not happen in practice — the machine refuses to
          // create events whose definitions aren't in the registry.
          return (
            <div key={e.id}>
              <p>
                <em>(Tuntematon tapahtuma: {e.eventId})</em>
              </p>
            </div>
          );
        }

        return (
          <div key={e.id}>
            <Markdown>
              {event
                .render(e)
                .filter((t) => t)
                .join("\n\n")}
            </Markdown>
            {!e.resolved && event.options && (
              <ul>
                {entries(event.options(e)).map(([key, option]) => {
                  return (
                    <li key={key}>
                      <a
                        href="#"
                        onClick={(evt) => {
                          evt.preventDefault();
                          onAnswer(e, key);
                        }}
                      >
                        {option}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Events;
