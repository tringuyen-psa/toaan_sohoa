import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfISOWeek,
  endOfMonth,
  format,
  getISOWeek,
  isValid,
  parseISO,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
} from "date-fns";

export type Period = "day" | "week" | "month";

export type PeriodRange = {
  period: Period;
  start: Date;        // inclusive start (00:00)
  end: Date;          // inclusive end (23:59:59.999)
  days: Date[];       // each day in the range
  label: string;      // "Thứ 2, 19/05/2026" | "Tuần 21 (18/05 - 24/05/2026)" | "Tháng 05/2026"
  totalLabel: string; // "TỔNG NGÀY 19/05" | "TỔNG TUẦN 21" | "TỔNG THÁNG 05/2026"
  current: string;    // ISO date to feed back in URL
  prev: string;       // ISO date for previous period
  next: string;       // ISO date for next period
};

const VN_WEEKDAY = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export function isPeriod(value: string | undefined | null): value is Period {
  return value === "day" || value === "week" || value === "month";
}

export function resolvePeriod(
  period: string | undefined | null,
  date: string | undefined | null,
  fallback: Period = "week"
): PeriodRange {
  const p: Period = isPeriod(period) ? period : fallback;
  const base = date && isValid(parseISO(date)) ? parseISO(date) : new Date();

  let start: Date;
  let end: Date;
  let label: string;
  let totalLabel: string;
  let prev: Date;
  let next: Date;

  if (p === "day") {
    start = startOfDay(base);
    end = endOfDay(base);
    label = `${VN_WEEKDAY[start.getDay()]}, ${format(start, "dd/MM/yyyy")}`;
    totalLabel = `TỔNG NGÀY ${format(start, "dd/MM")}`;
    prev = addDays(start, -1);
    next = addDays(start, 1);
  } else if (p === "month") {
    start = startOfMonth(base);
    end = endOfMonth(base);
    end.setHours(23, 59, 59, 999);
    label = `Tháng ${format(start, "MM/yyyy")}`;
    totalLabel = `TỔNG THÁNG ${format(start, "MM/yyyy")}`;
    prev = addMonths(start, -1);
    next = addMonths(start, 1);
  } else {
    start = startOfISOWeek(base);
    end = endOfISOWeek(base);
    end.setHours(23, 59, 59, 999);
    const wk = getISOWeek(start);
    label = `Tuần ${wk} (${format(start, "dd/MM")} - ${format(end, "dd/MM/yyyy")})`;
    totalLabel = `TỔNG TUẦN ${wk}`;
    prev = addDays(start, -7);
    next = addDays(start, 7);
  }

  const days = eachDayOfInterval({ start, end });

  return {
    period: p,
    start,
    end,
    days,
    label,
    totalLabel,
    current: format(start, "yyyy-MM-dd"),
    prev: format(prev, "yyyy-MM-dd"),
    next: format(next, "yyyy-MM-dd"),
  };
}
