import React from "react";

const TurnIndicator = (props) => {
  const { turn } = props;
  return (
    <span>
      {turn.season}, {turn.round} / {turn.phase}
    </span>
  );
};

export default TurnIndicator;
