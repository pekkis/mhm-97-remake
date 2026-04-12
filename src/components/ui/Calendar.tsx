import type { FC, ReactNode } from "react";
import calendar from "../../data/calendar";
import type { CalendarEntry } from "../../data/calendar";
import { useAppSelector } from "@/config/redux";
import type { Competition, CompetitionId } from "@/types/competitions";

type CalendarProps = {
  when: (
    entry: CalendarEntry,
    calendar: CalendarEntry[],
    competitions: Record<CompetitionId, Competition>
  ) => boolean;
  children: ReactNode;
  fallback?: ReactNode;
};

const Calendar: FC<CalendarProps> = ({ when, children, fallback = null }) => {
  const turn = useAppSelector((state) => state.game.turn);
  const competitions = useAppSelector((state) => state.game.competitions);

  const entry = calendar[turn.round];

  if (when(entry, calendar, competitions)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};

export default Calendar;
