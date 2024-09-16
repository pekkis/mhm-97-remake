import React from "react";
import Markdown from "../Markdown";

const Events = props => {
  const { announcements } = props;

  return (
    <div>
      <h2>Ilmoitukset</h2>

      {announcements
        .map((a, i) => {
          return (
            <div key={i}>
              <Markdown source={a} />
            </div>
          );
        })
        .toList()}
    </div>
  );
};

export default Events;
