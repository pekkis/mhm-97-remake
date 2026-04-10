import type { FC, ReactNode } from "react";
import calendar from "../../data/calendar";
import type { CalendarEntry } from "../../data/calendar";
import { useAppSelector } from "@/config/redux";
import type { RootState } from "@/config/redux";

type CalendarProps = {
  when: (
    entry: CalendarEntry,
    calendar: CalendarEntry[],
    state: RootState,
  ) => boolean;
  children: ReactNode;
  fallback?: ReactNode;
};

const Calendar: FC<CalendarProps> = ({ when, children, fallback = null }) => {
  const turn = useAppSelector((state) => state.game.turn);
  const state = useAppSelector((state) => state);

  const entry = calendar[turn.round];

  if (when(entry, calendar, state)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};

export default Calendar;
