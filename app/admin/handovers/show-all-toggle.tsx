"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Layers, Filter } from "lucide-react";

export function ShowAllToggle({ showAll }: { showAll: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  function toggle() {
    const next = new URLSearchParams(Array.from(search.entries()));
    if (showAll) next.delete("all");
    else next.set("all", "1");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={showAll ? "default" : "outline"}
      onClick={toggle}
    >
      {showAll ? <Filter className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
      {showAll ? "Lọc theo kỳ" : "Xem toàn bộ"}
    </Button>
  );
}
