"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

export function WeekPicker({ start, end, weekNumber }: { start: Date; end: Date; weekNumber: number }) {
  const router = useRouter();
  const search = useSearchParams();

  function goto(delta: number) {
    const next = addDays(start, delta * 7);
    const params = new URLSearchParams(Array.from(search.entries()));
    params.set("week", format(next, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`);
  }

  function today() {
    const params = new URLSearchParams(Array.from(search.entries()));
    params.delete("week");
    router.push(params.size ? `?${params.toString()}` : "?");
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={() => goto(-1)}>
        <ChevronLeft className="h-4 w-4" /> Tuần trước
      </Button>
      <div className="px-3 py-1.5 bg-[#1e3a8a] text-white rounded font-semibold text-sm">
        TUẦN {weekNumber} ({format(start, "dd/MM")} - {format(end, "dd/MM/yyyy")})
      </div>
      <Button variant="outline" size="sm" onClick={() => goto(1)}>
        Tuần sau <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={today}>
        <CalendarDays className="h-4 w-4 mr-1" /> Tuần này
      </Button>
    </div>
  );
}
