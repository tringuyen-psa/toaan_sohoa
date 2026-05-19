"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { Period, PeriodRange } from "@/lib/period";
import { cn } from "@/lib/utils";

export function PeriodPicker({ range }: { range: PeriodRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  function build(params: Record<string, string | undefined>) {
    const next = new URLSearchParams(Array.from(search.entries()));
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function setPeriod(p: Period) {
    if (p === range.period) return;
    router.push(build({ period: p, date: format(new Date(), "yyyy-MM-dd") }));
  }
  function go(target: string) {
    router.push(build({ period: range.period, date: target }));
  }
  function today() {
    router.push(build({ period: range.period, date: undefined }));
  }

  const onChangeDate = (value: string) => value && go(value);
  const onChangeMonth = (value: string) => value && go(value + "-01");

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="inline-flex rounded-md border bg-white shadow-sm overflow-hidden text-sm">
        {(["day", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "px-3 py-1.5 transition-colors",
              range.period === p
                ? "bg-[#1e3a8a] text-white font-semibold"
                : "hover:bg-slate-100"
            )}
          >
            {p === "day" ? "Ngày" : p === "week" ? "Tuần" : "Tháng"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => go(range.prev)} title="Trước">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {range.period === "day" && (
          <input
            type="date"
            value={range.current}
            onChange={(e) => onChangeDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium"
          />
        )}
        {range.period === "month" && (
          <input
            type="month"
            value={range.current.slice(0, 7)}
            onChange={(e) => onChangeMonth(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium"
          />
        )}
        {range.period === "week" && (
          <div className="px-3 py-1.5 bg-[#1e3a8a] text-white rounded font-semibold text-sm">
            {range.label}
          </div>
        )}

        <Button variant="outline" size="sm" onClick={() => go(range.next)} title="Sau">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={today}>
          <CalendarDays className="h-4 w-4 mr-1" /> Hôm nay
        </Button>
      </div>
    </div>
  );
}
