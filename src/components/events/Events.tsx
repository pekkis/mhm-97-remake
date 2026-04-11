import Markdown from "react-markdown";
import eventList from "../../data/events";

type EventsListProps = {
  events: Record<string, any>;
  manager: { id: string };
  onAnswer: (event: any, key: string) => void;
};

const Events = ({ events, manager, onAnswer }: EventsListProps) => {
  const managersEvents = Object.values(events).filter(
    (e) => e.manager === manager.id
  );

  return (
    <div>
      <p>{managersEvents.length} tapahtumaa...</p>

      {managersEvents.map((e) => {
        const event = eventList[e.eventId];

        return (
          <div key={e.id}>
            <Markdown>
              {event
                .render(e)
                .filter((t) => t)
                .join("\n\n")}
            </Markdown>
            {!e.resolved && (
              <ul>
                {Object.entries(event.options(e) as Record<string, string>).map(
                  ([key, option]) => {
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
                  }
                )}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Events;
