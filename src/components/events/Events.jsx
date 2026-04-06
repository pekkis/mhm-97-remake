import React from "react";
import Markdown from "react-markdown";
import eventList from "../../data/events";

const Events = (props) => {
  const { events, manager, resolveEvent } = props;

  const managersEvents = Object.values(events).filter(
    (e) => e.manager === manager.get("id")
  );

  return (
    <div>
      <p>{managersEvents.length} tapahtumaa...</p>

      {managersEvents.map((e) => {
        const event = eventList.get(e.eventId);

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
                {event
                  .options(e)
                  .map((option, key) => {
                    return (
                      <li key={key}>
                        <a
                          href="#"
                          onClick={(evt) => {
                            evt.preventDefault();
                            resolveEvent(e, key);
                          }}
                        >
                          {option}
                        </a>
                      </li>
                    );
                  })
                  .toList()}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Events;
