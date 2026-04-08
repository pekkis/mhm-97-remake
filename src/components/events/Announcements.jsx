import React from "react";
import Markdown from "react-markdown";

const Events = (props) => {
  const { announcements } = props;

  return (
    <div>
      <h2>Ilmoitukset</h2>

      {announcements.map((a, i) => {
        return (
          <div key={i}>
            <Markdown>{a}</Markdown>
          </div>
        );
      })}
    </div>
  );
};

export default Events;
