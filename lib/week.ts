import {
  startOfISOWeek,
  endOfISOWeek,
  addDays,
  getISOWeek,
  parseISO,
  isValid,
} from "date-fns";

export type WeekRange = {
  start: Date;
  end: Date;
  weekNumber: number;
  days: Date[];
};

export function getWeekRange(input?: string | Date): WeekRange {
  let base: Date;
  if (input instanceof Date) base = input;
  else if (typeof input === "string" && isValid(parseISO(input))) base = parseISO(input);
  else base = new Date();

  const start = startOfISOWeek(base);
  const end = endOfISOWeek(base);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return { start, end, weekNumber: getISOWeek(start), days };
}

export function shiftWeek(start: Date, deltaWeeks: number) {
  return addDays(start, deltaWeeks * 7);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
