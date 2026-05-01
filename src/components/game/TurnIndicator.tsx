import type { FC } from "react";

type TurnIndicatorProps = {
  turn: { season: number; round: number; phase: string | undefined };
};

const TurnIndicator: FC<TurnIndicatorProps> = ({ turn }) => {
  return (
    <span>
      {turn.round} / {turn.season + 1998}
    </span>
  );
};

export default TurnIndicator;
